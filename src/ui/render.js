import { createTemplates, LOGO } from "./templates.js";

const $ = (selector, root = document) => root.querySelector(selector);

export function createRenderer({ getProject, UI, botName, directions, chars, built, editableText, allProjects }) {
  const templates = createTemplates({ getProject, UI, botName, directions, chars, built, editableText, allProjects });

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
  function renderLive(animate) {
    const live = $("#live"); live.className = "live" + (animate ? " enter" : ""); live.innerHTML = templates.widgetHTML(); scrollDown();
    renderComposer();
  }
  function renderComposer() {
    const P = getProject();
    const ta = $("#composer"), send = $("#sendBtn");
    ta.placeholder = templates.composerPlaceholder(P.phase);
    const off = P.phase === "confirm" || P.phase === "generating" || P.phase === "reacting";
    ta.disabled = off; send.disabled = off;
  }
  function renderSide() {
    $("#sideBody").innerHTML = templates.sideHTML();
    $("#app").classList.toggle("side-closed", !UI.sideOpen);
  }
  function renderBar() { const gi = $("#gameName"); if (document.activeElement !== gi) gi.value = getProject().name; gi.size = Math.max(10, (gi.value || "").length + 2); }
  function renderPane() {
    const P = getProject();
    const app = $("#app"), v = P.versions[P.versions.length - 1];
    app.classList.toggle("has-pane", !!v && UI.paneOpen);
    if (!v) return;
    if (UI.reveal) { const p = $("#pane"); p.classList.remove("reveal"); void p.offsetWidth; p.classList.add("reveal"); UI.reveal = false; }
    $("#paneTitle").textContent = P.name || "My game"; $("#paneVer").textContent = "v" + v.n;
    $("#rbBtn").disabled = P.versions.length < 2; $("#rbBtn").title = P.versions.length < 2 ? "No earlier version yet" : "Go back to the last version";
    $("#legend").innerHTML = templates.paneLegendHTML(v.spec);
  }
  function renderTabs() {
    $("#app").dataset.tab = UI.tab;
    $("#tabbar").querySelectorAll("[data-tab]").forEach(b => { b.classList.toggle("on", b.dataset.tab === UI.tab); if (b.dataset.tab === "preview") b.disabled = !getProject().versions.length; });
  }
  function renderBoard(boardEl) {
    if (!UI.boardOpen) { if (boardEl) boardEl.remove(); return null; }
    if (!boardEl) {
      boardEl = document.createElement("div"); boardEl.className = "modal";
      boardEl.innerHTML = templates.boardShellHTML();
      $("#layer").appendChild(boardEl);
    }
    $("#boardBody").innerHTML = templates.boardHTML(); $("#boardFoot").innerHTML = templates.boardFoot();
    return boardEl;
  }
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
  return { msgNode, scrollDown, showTyping, renderMsgs, renderLive, renderSide, renderBar, renderPane, renderTabs, renderBoard, makeCallout, showAsk, createSheet, renderBrand };
}
