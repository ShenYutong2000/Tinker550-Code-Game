import { createTemplates, LOGO } from "./templates.js";
import { getAssessmentView, getJournalEntries } from "../state/journal.js";

const $ = (selector, root = document) => root.querySelector(selector);

export function createRenderer({ getProject, UI, botName, directions, chars, built, editableText, allProjects, engineSource }) {
  const templates = createTemplates({ getProject, UI, botName, directions, chars, built, editableText, allProjects, engineSource,
    journalEntries: () => getJournalEntries(getProject()), assessmentView: () => getAssessmentView(getProject(), UI) });

  function msgNode(m, anim) {
    const d = document.createElement("div");
    d.className = "msg " + (m.who === "kid" ? "kid" : "sprout") + (anim ? " enter" : "");
    d.innerHTML = templates.messageHTML(m);
    return d;
  }
  function scrollDown() { const f = $("#feed"); f.scrollTop = f.scrollHeight; }
  function showTyping(on) {
    const live = $("#live");
    if (on) { live.className = "live"; live.innerHTML = templates.typingHTML(); }
    else live.innerHTML = "";
    scrollDown();
  }
  function renderMsgs() { const box = $("#msgs"); box.innerHTML = ""; getProject().chat.forEach(m => box.appendChild(msgNode(m, false))); scrollDown(); }
  function renderJournal() { $("#journalEntries").innerHTML = templates.journalHTML(); }
  function renderLive(animate) {
    const live = $("#live"); live.className = "live" + (animate ? " enter" : ""); live.innerHTML = templates.widgetHTML(); scrollDown();
    renderComposer();
  }
  function renderComposer() {
    const P = getProject();
    const ta = $("#composer"), send = $("#sendBtn");
    ta.placeholder = templates.composerPlaceholder(P.phase);
    const off = P.phase === "generating" || P.phase === "reacting";
    ta.disabled = off; send.disabled = off;
  }
  function renderProjects() {
    const body=$("#projectManagerBody");
    if(body)body.innerHTML=templates.projectsHTML();
  }
  function renderBar() { const gi = $("#gameName"); if (document.activeElement !== gi) gi.value = getProject().name; gi.size = Math.max(10, (gi.value || "").length + 2); }
  function renderPane() {
    const P = getProject();
    const app = $("#app"), v = P.versions[P.versions.length - 1];
    app.classList.toggle("has-pane", !!v);
    const undo = $("#rbBtn"), exportButton = $("[data-act=export]");
    if (undo) {
      undo.disabled = !v || P.versions.length < 2;
      undo.title = P.versions.length < 2 ? "No earlier version yet" : "Go back to the last version";
    }
    if (exportButton) exportButton.disabled = !v;
    $("#assessment").innerHTML = templates.assessmentHTML();
    renderCode();
    if (!v) {
      $("#paneTitle").textContent = "";
      $("#paneVer").textContent = "";
      $("#legend").innerHTML = "";
      return;
    }
    if (UI.reveal) { const p = $("#pane"); p.classList.remove("reveal"); void p.offsetWidth; p.classList.add("reveal"); UI.reveal = false; }
    $("#paneTitle").textContent = P.name || "My game"; $("#paneVer").textContent = "v" + v.n;
    $("#legend").innerHTML = templates.paneLegendHTML(v.spec);
  }
  function renderTabs() {
    const app=$("#app");
    app.dataset.tab = UI.tab;
    app.classList.toggle("journal-closed",!UI.journalOpen);
    app.classList.toggle("preview-closed",!UI.previewOpen);
    const journalLabel=UI.journalOpen?"Hide Design Journal":"Show Design Journal";
    for(const button of [$("#toggleJournal"),$("#toggleJournalTop")].filter(Boolean)){button.title=journalLabel;button.setAttribute("aria-label",journalLabel);button.setAttribute("aria-pressed",String(UI.journalOpen));const icon=button.querySelector("[data-toggle-icon]");if(icon)icon.textContent=UI.journalOpen?"‹":"›";}
    const previewLabel=UI.previewOpen?"Hide Preview":"Show Preview";
    for(const button of [$("#togglePreview"),$("#togglePreviewTop")].filter(Boolean)){button.title=previewLabel;button.setAttribute("aria-label",previewLabel);button.setAttribute("aria-pressed",String(UI.previewOpen));const icon=button.querySelector("[data-toggle-icon]");if(icon)icon.textContent=UI.previewOpen?"›":"‹";}
    $("#tabbar").querySelectorAll("[data-tab]").forEach(b => { b.classList.toggle("on", b.dataset.tab === UI.tab); if (b.dataset.tab === "preview") b.disabled = !getProject().versions.length; });
  }
  function renderBoard(boardEl) {
    if (!boardEl) boardEl=$("#boardColumn");
    const old=$("#mapViewport");
    if(old){UI.mapScrollLeft=old.scrollLeft;UI.mapScrollTop=old.scrollTop;}
    $("#boardBody").innerHTML = templates.boardHTML(); $("#boardFoot").innerHTML = templates.boardFoot();
    const viewport=$("#mapViewport"),world=$("#mapWorld");
    /* after a new draft (or "Fit"), zoom so all nine clusters are visible, once the viewport has a size */
    if(UI.fitMap&&viewport&&world&&viewport.clientWidth>0){
      const w=parseFloat(world.style.width),h=parseFloat(world.style.height);
      UI.mapZoom=Math.max(.35,Math.min(1,(viewport.clientWidth-16)/w,(viewport.clientHeight-16)/h));
      UI.fitMap=false;UI.mapScrollLeft=0;UI.mapScrollTop=0;
      $("#boardBody").innerHTML = templates.boardHTML();
    }
    const next=$("#mapViewport");
    if(next){next.scrollLeft=UI.mapScrollLeft||0;next.scrollTop=UI.mapScrollTop||0;}
    return boardEl;
  }
  /* the Play / Code switch in the game pane; the canvas keeps running while the code is shown */
  function renderCode() {
    const view = $("#codeView"), code = UI.paneTab === "code";
    if (!view) return;
    $("#pane").classList.toggle("code-on", code);
    document.querySelectorAll("[data-pane-tab]").forEach(b => { const on = b.dataset.paneTab === (code ? "code" : "play"); b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    view.hidden = !code;
    if (code) {
      const open = [...view.querySelectorAll("details")].map(d => d.open), editing = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.codeEdit, top = view.parentElement.scrollTop;
      view.innerHTML = templates.codeViewHTML();
      view.querySelectorAll("details").forEach((d, i) => { if (open[i] !== undefined && d.classList.contains("code-all")) d.open = open[i]; });
      /* keep the place and the slot being changed, so a block can be tuned again and again */
      view.parentElement.scrollTop = top;
      if (editing) [...view.querySelectorAll("[data-code-edit]")].find(el => el.dataset.codeEdit === editing)?.focus({ preventScroll: true });
    }
  }
  function renderEdges() { const layer = $("#mapEdges"); if (layer) layer.innerHTML = templates.edgesHTML(); }
  function makeCallout(info, more) {
    const co = document.createElement("div");
    co.className = "callout"; co.setAttribute("role", "dialog"); co.setAttribute("aria-label", info.zh);
    co.innerHTML = templates.guideCalloutHTML(info, more);
    if (info.mini) co.classList.add("mini");
    return co;
  }
  function showAsk(gs) {
    const pane = $("#pane .cab");
    if (pane && !pane.querySelector(".ask")) { const a = document.createElement("div"); a.className = "ask"; a.setAttribute("role", "status"); a.innerHTML = templates.askHTML(gs, innerWidth <= 900); pane.appendChild(a); }
  }
  function createSheet(title, sub, body) {
    const m = document.createElement("div"); m.className = "modal";
    m.innerHTML = templates.sheetHTML(title, sub, body);
    return m;
  }
  function renderBrand() { document.querySelectorAll("[data-bricks]").forEach(box => { box.innerHTML = LOGO; }); }
  return { msgNode, scrollDown, showTyping, renderMsgs, renderJournal, renderLive, renderProjects, renderBar, renderPane, renderTabs, renderBoard, renderEdges, renderCode, makeCallout, showAsk, createSheet, renderBrand };
}
