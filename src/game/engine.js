
(function(){
const rand=(a,b)=>a+Math.random()*(b-a);
const W=480,H=320,GROUND=H-30;
const EMOJI='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function Game(canvas){
  const g=canvas.getContext("2d");
  let sp=null,st=null,lastInput="keys",best=[];
  const keys=new Set(),pressed=new Set();
  const mouse={x:W/2,y:H/2,active:false,clicked:false};
  let focused=false;
  const bgStars=Array.from({length:46},()=>({x:Math.random()*W,y:Math.random()*H*.85,s:Math.random()<.2?2:1,p:Math.random()*6}));
  function fit(){const d=Math.min(2,devicePixelRatio||1);canvas.width=W*d;canvas.height=H*d;g.setTransform(d,0,0,d,0,0);}
  fit();
  const norm=k=>k.length===1?k.toLowerCase():k;
  canvas.addEventListener("keydown",e=>{const k=norm(e.key);if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","w","a","s","d","f"].includes(k))e.preventDefault();if(!keys.has(k))pressed.add(k);keys.add(k);lastInput="keys";});
  canvas.addEventListener("keyup",e=>keys.delete(norm(e.key)));
  canvas.addEventListener("focus",()=>focused=true);
  canvas.addEventListener("blur",()=>{focused=false;keys.clear();});
  const pos=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};};
  canvas.addEventListener("pointermove",e=>{const p=pos(e);mouse.x=p.x;mouse.y=p.y;mouse.active=true;lastInput="mouse";});
  canvas.addEventListener("pointerdown",e=>{const p=pos(e);mouse.x=p.x;mouse.y=p.y;mouse.active=true;if(focused)mouse.clicked=true;canvas.focus();if(e.pointerType!=="mouse")lastInput="mouse";});

  function hero(i){
    const e=i===0?sp.hero:(sp.others[0]||sp.hero);
    const m=sp.mode;
    return {i,e:e?e.e:"👾",n:e?e.n:"",x:m==="jump"?90+i*46:W/2+(sp.players===2?(i?60:-60):0),y:m==="roam"?H/2:GROUND-18,vy:0,kx:0,r:18,scale:1,ts:1,glow:0,stun:0,inv:0,dir:1,moving:0,cd:0,onGround:true};
  }
  function load(spec){sp=spec;reset();}
  function clear(){sp=null;st=null;}
  function reset(){
    st={t:0,heroes:[hero(0)],goods:[],hz:[],bul:[],parts:[],pops:[],npcs:[],score:[0,0],lives:sp.lives||0,timer:sp.timer||0,coins:0,sg:.4,sh:1.2,sb:2,over:null,ot:0,enemy:null,alive:0};
    if(sp.players===2) st.heroes.push(hero(1));
    const npcSrc=sp.players===2?sp.others.slice(1):sp.others;
    npcSrc.forEach((o,k)=>st.npcs.push({e:o.e,x:60+k*90,y:sp.mode==="roam"?80+k*40:GROUND-16,vx:(k%2?-1:1)*40,t:Math.random()*5}));
    if(sp.enemy) st.enemy={x:W-30,y:40,e:sp.enemy};
  }
  const hasScore=()=>sp.onCatch==="score"||sp.dodgeScore||sp.jumpScore;
  function addScore(i,n,x,y){const k=sp.pmode==="versus"?i:0;st.score[k]+=n;st.pops.push({x,y,t:0,s:"+"+n,c:"#FFD166"});}
  function poof(x,y,c){for(let k=0;k<10;k++){const a=Math.random()*6.28,v=rand(40,140);st.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:rand(.3,.6),c});}}
  function confetti(){for(let k=0;k<90;k++)st.parts.push({x:rand(0,W),y:rand(-60,0),vx:rand(-30,30),vy:rand(60,160),t:0,life:2.6,c:["#FF6B35","#FFD166","#5EE6B8","#FF7B7B"][k%4],sq:1});}
  function end(kind){
    if(st.over)return;st.over=kind;st.ot=0;
    const tot=st.score[0]+st.score[1];
    if(sp.outcome==="leaderboard"){best.push(tot);best.sort((a,b)=>b-a);best=best.slice(0,5);}
    if(sp.outcome==="celebrate"&&kind==="win")confetti();
  }
  function ctrl(i){
    const c=sp.control,two=sp.players===2,k=keys;let dx=0,dy=0,jump=false,fire=false;
    if(i===0&&c!=="mouse"){
      if(k.has("ArrowLeft")||(!two&&k.has("a")))dx--;if(k.has("ArrowRight")||(!two&&k.has("d")))dx++;
      if(k.has("ArrowUp")||(!two&&k.has("w")))dy--;if(k.has("ArrowDown")||(!two&&k.has("s")))dy++;
      jump=pressed.has(" ")||pressed.has("ArrowUp")||(!two&&pressed.has("w"));fire=pressed.has(" ");
    }
    if(i===1){if(k.has("a"))dx--;if(k.has("d"))dx++;if(k.has("w"))dy--;if(k.has("s"))dy++;jump=pressed.has("w");fire=pressed.has("f");}
    const useMouse=i===0&&c!=="keys"&&mouse.active&&(c==="mouse"||lastInput==="mouse");
    if(i===0&&c!=="keys"&&mouse.clicked){jump=true;fire=true;}
    return {dx,dy,jump,fire,useMouse};
  }
  function hitHero(h,x,y){
    if(h.inv>0||st.over)return;
    h.inv=1.1;poof(x,y,"#FF7B7B");
    if(sp.lives){st.lives--;st.pops.push({x:h.x,y:h.y-30,t:0,s:"-❤️",c:"#FF7B7B"});if(st.lives<=0){end("lose");return;}}
    if(sp.onHit==="stun")h.stun=1;
    if(sp.onHit==="shrink")h.ts=Math.max(.55,h.ts-.15);
    if(sp.onHit==="reset"){reset();st.pops.push({x:W/2,y:H/2,t:0,s:"START OVER!",c:"#FF7B7B"});}
  }
  function caught(h,o,byBullet){
    poof(o.x,o.y,"#FFD166");
    if(sp.coins){st.coins++;st.pops.push({x:o.x,y:o.y-14,t:0,s:"🪙",c:"#FFD166"});}
    const r=sp.onCatch;
    if(r==="score")addScore(h.i,1,o.x,o.y);
    if(r==="grow"){h.ts=Math.min(1.9,h.ts+.12);h.glow=1.4;}
    if(r==="bounce"){
      if(sp.mode==="roam"){o.x=rand(30,W-30);o.y=rand(40,GROUND-30);o.hop=.4;}else{o.vy=-260;o.y-=6;o.grav=1;o.cool=.4;}
      return false;
    }
    if(r==="split"&&byBullet&&o.r>9){for(const s of [-1,1])st.goods.push({x:o.x,y:o.y,vx:s*rand(60,100),vy:0,r:o.r*.65,e:o.e,ph:Math.random()*6});}
    return true;
  }
  function update(dt){
    st.t+=dt;
    for(const p of st.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.sq)p.vy+=180*dt;}
    st.parts=st.parts.filter(p=>p.t<p.life);
    for(const p of st.pops)p.t+=dt;st.pops=st.pops.filter(p=>p.t<.9);
    for(const n of st.npcs){n.t+=dt;if(sp.mode==="roam"){n.x+=n.vx*dt;n.y+=Math.sin(n.t*1.3)*20*dt;}else n.x+=n.vx*dt;if(n.x<20||n.x>W-20)n.vx*=-1;}
    if(st.over){
      st.ot+=dt;const o=sp.outcome;
      const wait=o==="celebrate"?3:o==="endScreen"||o==="leaderboard"?Infinity:1.4;
      if(st.ot>wait||((o==="endScreen"||o==="leaderboard")&&st.ot>.5&&(mouse.clicked||pressed.has(" "))))reset();
      return;
    }
    st.alive+=dt;
    const m=sp.mode,sm=sp.speedUp?1+st.t/30:1,spd=200*(sp.speed||1);
    for(const h of st.heroes){
      const c=ctrl(h.i);
      h.inv=Math.max(0,h.inv-dt);h.glow=Math.max(0,h.glow-dt);h.cd=Math.max(0,h.cd-dt);
      h.scale+=(h.ts-h.scale)*Math.min(1,dt*6);
      const ox=h.x;
      if(h.stun>0){h.stun-=dt;}
      else if(m==="jump"){
        if(c.jump&&h.onGround){h.vy=-430;h.onGround=false;}
      } else {
        if(c.useMouse){h.x+=(mouse.x-h.x)*Math.min(1,dt*9);if(m==="roam")h.y+=(mouse.y-h.y)*Math.min(1,dt*9);}
        else{h.x+=c.dx*spd*dt;if(m==="roam")h.y+=c.dy*spd*dt;}
        if(m==="shoot"&&c.fire&&h.cd<=0){st.bul.push({x:h.x,y:h.y-20,i:h.i});h.cd=.25;}
      }
      h.x+=h.kx*dt;h.kx*=Math.pow(.02,dt);
      if(m==="jump"){h.vy+=1200*dt;h.y+=h.vy*dt;const gy=GROUND-18*h.scale;if(h.y>=gy){h.y=gy;h.vy=0;h.onGround=true;}
        if(sp.bound==="ceiling"&&h.y<70){h.y=70;h.vy=Math.abs(h.vy)*.3;st.pops.push({x:h.x,y:60,t:0,s:"BONK!",c:"#FF7B7B"});}
        if(h.y<16){h.y=16;h.vy=Math.max(0,h.vy);}
      } else {
        const r=h.r*h.scale,b=sp.bound||"clamp";
        const yMin=m==="roam"?r+6:0,yMax=m==="roam"?GROUND-r:H;
        if(b==="wrap"){if(h.x<-r)h.x=W+r;if(h.x>W+r)h.x=-r;if(m==="roam"){if(h.y<-r)h.y=GROUND;if(h.y>GROUND+r)h.y=0;}}
        else{
          if(b==="bounce"){if(h.x<r){h.x=r;h.kx=320;}if(h.x>W-r){h.x=W-r;h.kx=-320;}}
          h.x=Math.max(r,Math.min(W-r,h.x));
          if(m==="roam")h.y=Math.max(yMin,Math.min(yMax,h.y));
        }
        if(m!=="roam")h.y=GROUND-18*h.scale;
      }
      const mv=h.x-ox;h.moving+=((Math.abs(mv)>.3?1:0)-h.moving)*Math.min(1,dt*10);if(Math.abs(mv)>.3)h.dir=mv>0?1:-1;
    }
    // spawning
    st.sg-=dt;st.sh-=dt;st.sb-=dt;
    const item=sp.item||{e:"⭐"};
    if(m==="catch"&&st.sg<=0){st.goods.push({x:rand(20,W-20),y:-16,vy:rand(70,110)*sm,r:14,e:item.e,ph:Math.random()*6});st.sg=.95/sm;}
    if(m==="roam"&&st.goods.length<4&&st.sg<=0){st.goods.push({x:rand(30,W-30),y:rand(40,GROUND-30),r:14,e:item.e,ph:Math.random()*6});st.sg=.8;}
    if(m==="shoot"&&st.goods.length<5&&st.sg<=0){const l=Math.random()<.5;st.goods.push({x:l?-10:W+10,y:rand(40,150),vx:(l?1:-1)*rand(50,90)*sm,r:15,e:item.e,ph:Math.random()*6});st.sg=1.1/sm;}
    if(m==="dodge"&&st.sh<=0){st.hz.push({x:rand(16,W-16),y:-16,vy:rand(110,160)*sm,r:14,e:item.e,spin:rand(-3,3),a:0});st.sh=(sp.dense?.38:.7)/sm;}
    if(m==="jump"&&st.sh<=0){const big=sp.tall?1.5:1;st.hz.push({x:W+20,y:GROUND-14*big,vx:-170*sm,r:14*big,e:item.e,a:0,ground:1});st.sh=rand(1.2,2.1)/sm;}
    if(sp.hazard&&st.sb<=0){
      if(m==="jump")st.hz.push({x:W+20,y:GROUND-85,vx:-210*sm,r:13,e:sp.hazard,a:0});
      else st.hz.push({x:rand(16,W-16),y:-16,vy:rand(100,140)*sm,r:13,e:sp.hazard,spin:rand(-2,2),a:0});
      st.sb=1.9/sm;
    }
    // move things
    for(const o of st.goods){
      o.ph+=dt;
      if(o.grav){o.vy+=420*dt;o.cool-=dt;}
      if(o.vy!==undefined)o.y+=o.vy*dt;
      if(o.vx){o.x+=o.vx*dt;if((o.x<12&&o.vx<0)||(o.x>W-12&&o.vx>0))o.vx*=-1;}
      if(o.hop)o.hop=Math.max(0,o.hop-dt);
    }
    st.goods=st.goods.filter(o=>o.y<H+30);
    for(const o of st.hz){o.a+=(o.spin||0)*dt;if(o.vy)o.y+=o.vy*dt;if(o.vx)o.x+=o.vx*dt;
      if(m==="dodge"&&!o.done&&o.y>H+10){o.done=1;if(sp.dodgeScore)addScore(0,1,o.x,H-20);}
      if(m==="jump"&&o.ground&&!o.passed&&o.x<st.heroes[0].x-20){o.passed=1;if(sp.jumpScore)addScore(0,1,o.x,o.y-30);}
    }
    st.hz=st.hz.filter(o=>o.y<H+30&&o.x>-40&&!o.dead);
    for(const b of st.bul)b.y-=380*dt;st.bul=st.bul.filter(b=>b.y>-10&&!b.dead);
    // collisions
    for(const h of st.heroes){
      const hr=h.r*h.scale;
      if(m==="catch"||m==="roam")for(const o of st.goods){if(o.dead||(o.cool>0))continue;if(Math.hypot(o.x-h.x,o.y-h.y)<(hr+o.r)*.85){if(caught(h,o,false))o.dead=1;}}
      for(const o of st.hz){if(o.dead)continue;if(Math.hypot(o.x-h.x,o.y-h.y)<(hr+o.r)*.8){if(h.inv<=0){o.dead=1;hitHero(h,o.x,o.y);}}}
      if(st.enemy&&Math.hypot(st.enemy.x-h.x,st.enemy.y-h.y)<hr+12){hitHero(h,st.enemy.x,st.enemy.y);if(st.enemy){st.enemy.x=h.x<W/2?W-20:20;st.enemy.y=30;}}
    }
    for(const b of st.bul)for(const o of st.goods){if(o.dead||b.dead)continue;if(Math.hypot(o.x-b.x,o.y-b.y)<o.r+5){b.dead=1;if(caught(st.heroes[b.i]||st.heroes[0],o,true))o.dead=1;}}
    st.goods=st.goods.filter(o=>!o.dead);st.bul=st.bul.filter(b=>!b.dead);st.hz=st.hz.filter(o=>!o.dead);
    if(st.enemy){const h=st.heroes[0];const a=Math.atan2(h.y-st.enemy.y,h.x-st.enemy.x),v=55*sm;st.enemy.x+=Math.cos(a)*v*dt;st.enemy.y+=Math.sin(a)*v*dt;}
    // end conditions
    if(sp.timer){st.timer-=dt;if(st.timer<=0){st.timer=0;end(sp.surviveWin?"win":"time");}}
    const goal=sp.winAt||sp.target;
    if(goal&&hasScore()&&Math.max(st.score[0],st.score[1])>=goal)end("win");
    if(goal&&!hasScore()&&sp.coins&&st.coins>=goal)end("win");
  }
  function emoji(e,x,y,size,a){g.save();g.translate(x,y);if(a)g.rotate(a);g.font=`${size}px ${EMOJI}`;g.textAlign="center";g.textBaseline="middle";g.fillText(e,0,0);g.restore();}
  function pix(t,x,y,size,col,align){g.font=`${size}px "Press Start 2P", monospace`;g.fillStyle=col;g.textAlign=align||"left";g.textBaseline="top";g.fillText(t,x,y);}
  function draw(){
    const grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,"#120C2A");grd.addColorStop(1,"#2A1745");g.fillStyle=grd;g.fillRect(0,0,W,H);
    const t=performance.now()/1000;
    for(const s of bgStars){g.globalAlpha=.35+.35*Math.sin(t*2+s.p);g.fillStyle="#FFD166";g.fillRect(s.x,s.y,s.s,s.s);}g.globalAlpha=1;
    if(!sp){pix("WAITING FOR v1",W/2,H/2-6,10,"#ABA0D2","center");return;}
    // floor
    g.fillStyle="#1B1236";g.fillRect(0,GROUND,W,H-GROUND);
    g.fillStyle="#FF6B35";g.fillRect(0,GROUND,W,3);
    const off=sp.mode==="jump"?(st.t*170*(sp.speedUp?1+st.t/30:1))%24:0;
    g.fillStyle="#3E2A66";for(let x=-off;x<W;x+=24)g.fillRect(x,GROUND+10,12,4);
    // npcs
    for(const n of st.npcs){const b=1+Math.sin(n.t*3)*.05;emoji(n.e,n.x,n.y+Math.sin(n.t*6)*2,26*b);}
    for(const o of st.goods){const bob=o.vy===undefined&&!o.vx?Math.sin(o.ph*3)*3:0;const s=o.r*2*(o.hop?1+o.hop:1);emoji(o.e,o.x,o.y+bob,s,Math.sin(o.ph*2)*.15);}
    for(const o of st.hz)emoji(o.e,o.x,o.y,o.r*2,o.a);
    if(st.enemy)emoji(st.enemy.e,st.enemy.x,st.enemy.y+Math.sin(st.t*4)*3,26);
    g.fillStyle="#5EE6B8";for(const b of st.bul){g.beginPath();g.arc(b.x,b.y,4,0,6.28);g.fill();}
    for(const h of st.heroes){
      const br=1+Math.sin(st.t*3.2+h.i)*.05;
      const sz=34*h.scale;
      g.fillStyle="rgba(0,0,0,.35)";g.beginPath();const sy=sp.mode==="roam"?h.y+sz*.5:GROUND+2;g.ellipse(h.x,sy,sz*.38*(sp.mode==="jump"?Math.max(.4,1-(GROUND-h.y)/220):1),4,0,0,6.28);g.fill();
      if(h.glow>0||h.scale>1.05){const gl=g.createRadialGradient(h.x,h.y,4,h.x,h.y,sz);gl.addColorStop(0,`rgba(255,209,102,${.25+.35*Math.min(1,h.glow)})`);gl.addColorStop(1,"rgba(255,209,102,0)");g.fillStyle=gl;g.beginPath();g.arc(h.x,h.y,sz,0,6.28);g.fill();}
      if(h.inv>0&&Math.floor(h.inv*12)%2)g.globalAlpha=.35;
      g.save();g.translate(h.x,h.y+(1-br)*sz*.5);g.scale(h.dir*(1+h.moving*.05),br*(1-h.moving*.04));g.rotate(h.moving*.08*h.dir*Math.sin(st.t*14));
      g.font=`${sz}px ${EMOJI}`;g.textAlign="center";g.textBaseline="middle";g.fillText(h.e,0,0);g.restore();g.globalAlpha=1;
      if(h.stun>0)emoji("💫",h.x,h.y-sz*.7,14,st.t*4);
      if(sp.players===2)pix("P"+(h.i+1),h.x,h.y-sz*.75-10,7,h.i?"#5EE6B8":"#FFD166","center");
    }
    for(const p of st.parts){g.globalAlpha=1-p.t/p.life;g.fillStyle=p.c;g.fillRect(p.x,p.y,p.sq?5:3,p.sq?5:3);}g.globalAlpha=1;
    for(const p of st.pops){g.globalAlpha=1-p.t/.9;if(/[\u{1F000}-\u{1FFFF}❤]/u.test(p.s))emoji(p.s,p.x,p.y-p.t*30,14);else pix(p.s,p.x,p.y-p.t*30,10,p.c,"center");}g.globalAlpha=1;
    // HUD
    let x=10;const y=10;
    if(hasScore()){
      if(sp.pmode==="versus"){pix(`P1 ${st.score[0]}  P2 ${st.score[1]}`,x,y,10,"#FFD166");x+=150;}
      else{const goal=sp.winAt||sp.target;emoji("⭐",x+8,y+6,13);pix(st.score[0]+(goal?"/"+goal:""),x+20,y+1,10,"#FFD166");x+=80;}
    }
    if(sp.lives){for(let k=0;k<sp.lives;k++){g.globalAlpha=k<st.lives?1:.25;emoji("❤️",x+8+k*18,y+6,13);}g.globalAlpha=1;x+=sp.lives*18+10;}
    if(sp.coins){emoji("🪙",x+8,y+6,13);pix(""+st.coins,x+18,y+1,10,"#FFD166");x+=50;}
    if(sp.timer)pix("⏱"+Math.ceil(st.timer),W-10,y,10,st.timer<6?"#FF7B7B":"#5EE6B8","right");
    else if(sp.survive)pix(st.alive.toFixed(1)+"s",W-10,y,10,"#5EE6B8","right");
    // over screens
    if(st.over){
      const o=sp.outcome,tot=st.score[0]+st.score[1];
      if(o==="endScreen"||o==="leaderboard"){
        g.fillStyle="rgba(10,6,24,.82)";g.fillRect(70,46,W-140,H-92);g.strokeStyle="#FF6B35";g.lineWidth=3;g.strokeRect(70,46,W-140,H-92);
        pix(st.over==="win"?"YOU WIN":"GAME OVER",W/2,64,14,"#FFD166","center");
        pix((sp.pmode==="versus"?`P1 ${st.score[0]} : P2 ${st.score[1]}`:"SCORE "+(hasScore()?tot:sp.coins?st.coins:st.alive.toFixed(1)+"s")),W/2,96,10,"#fff","center");
        if(o==="leaderboard")best.forEach((b,k)=>pix(`${k+1}. ${b}`,W/2,124+k*18,9,k?"#ABA0D2":"#5EE6B8","center"));
        pix("CLICK / SPACE",W/2,H-70,8,"#FF6B35","center");
      } else if(o==="celebrate"){
        pix(st.over==="win"?"YOU WIN!":"SO CLOSE!",W/2,H/2-30,22,st.over==="win"?"#FFD166":"#FF7B7B","center");
        if(st.over==="win")emoji("🎉",W/2,H/2+20,40);
      } else {
        g.fillStyle="rgba(10,6,24,.6)";g.fillRect(0,H/2-24,W,40);pix("GAME OVER, RESTARTING…",W/2,H/2-12,12,"#fff","center");
      }
    }
    if(!focused){g.fillStyle="rgba(255,107,53,.92)";g.fillRect(0,H-22,W,22);pix("CLICK TO PLAY",W/2,H-17,9,"#fff","center");}
  }
  let last=performance.now();
  function loop(now){
    const dt=Math.min(.033,(now-last)/1000);last=now;
    if(sp)update(dt);
    pressed.clear();mouse.clicked=false;
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return {load,clear};
}
Game.prototype=null;
window.TinkerEngine=function(cv){const g=Game(cv);return g;};
})();
