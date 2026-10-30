import engineSource from "./engine.js?raw";

export function exportStandaloneGame(v, projectName, {sheet, toast, esc}){
  if(!v)return;
  const name=(projectName||"my-game").trim();
  const src=engineSource;
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap">
<style>html,body{margin:0;height:100%;background:#18141F;color:#EEEAF6;font-family:system-ui,sans-serif}main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box}h1{font-size:18px;margin:0}canvas{width:min(720px,100%);aspect-ratio:3/2;border:3px solid #FF6B35;border-radius:12px;background:#0E0A22}p{margin:0;font-size:12px;color:#9D96B0}</style></head>
<body><main><h1>${esc(name)}</h1><canvas id="cv" tabindex="0"></canvas><p>Made with Tinkercade</p></main>
<script>${src.replace(/<\/script/gi,"<\\/script")}<\/script>
<script>window.TinkerEngine(document.getElementById("cv")).load(${JSON.stringify(v.spec)});document.getElementById("cv").focus();<\/script>
</body></html>`;
  const filename=name.replace(/[\\/:*?"<>|]/g,"_")+".html";
  const fallback=()=>{
    const m=sheet("Export HTML","A one-file mini game",`<p class="hint">You can't download it here yet. Copy the code below, save it as <b style="color:var(--yellow)">${esc(filename)}</b>, then double-click it to play.</p><textarea class="code" readonly id="codeOut"></textarea><div class="row"><button class="btn" id="copyBtn">Copy code</button></div>`);
    const ta=m.querySelector("#codeOut");ta.value=html;
    m.querySelector("#copyBtn").onclick=()=>{navigator.clipboard.writeText(html).then(()=>toast("Copied!"),()=>{ta.focus();ta.select();toast("Selected. Press Ctrl/⌘+C to copy");});};
  };
  if(!(window.claude&&window.claude.use)){fallback();return;}
  window.claude.use("downloads").then(dl=>{
    if(!dl){fallback();return;}
    return dl.save({filename,data:html}).then(()=>toast("Exported "+filename),err=>{if(err&&err.code==="declined")return;fallback();});
  },fallback);
}

