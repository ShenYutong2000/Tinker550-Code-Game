import { noteLinks } from "./design-map.js";

/* Key action loops: the things a player does again and again. A loop is a group of notes that are already
   on the design map, so both views always agree; a note can be in more than one loop. Loops are design only:
   they never change the game by themselves, the logic stickers between their notes do. */

let nextLoop = 0;
const nextId = () => `loop-${Date.now().toString(36)}-${(++nextLoop).toString(36)}`;

/* what a note does in the game; draft notes may already carry a key (hero, action, hit) */
export function loopRole(note) {
  const e = note.effect || {};
  if (note.col === "character") return "hero";
  if (note.key) return note.key;
  if (e.mode) return "action";
  if (e.lives) return "lives";
  if (e.timer && note.col === "resources") return "timer";
  if (e.hazard || e.enemy || e.dense || e.tall) return "danger";
  if (e.speedUp) return "faster";
  if (e.onCatch === "score" || e.dodgeScore || e.jumpScore) return "score";
  if (e.onHit || (note.col === "rules" && /li(fe|ves)/i.test(note.text))) return "hit";
  if (note.col === "outcome") return "end";
  if (note.col === "procedures") return "controls";
  if (note.col === "players") return "players";
  return null;
}

/* the first loops, each in the order a player goes around it; notes no role fits join by their element */
const DRAFT_LOOPS = [
  { name: "Core loop: play and score", roles: ["players", "controls", "hero", "action", "score"], cols: ["players", "objectives", "procedures", "rules", "boundaries"] },
  { name: "Challenge loop: danger and lives", roles: ["danger", "faster", "hero", "hit", "lives"], cols: ["conflict"] },
  { name: "Ending loop: how it ends", roles: ["score", "lives", "timer", "end"], cols: ["resources", "outcome"] }
];
export function suggestLoops(notes) {
  return DRAFT_LOOPS.map(plan => {
    /* in a dodging or jumping game the main things are the danger too */
    const roles = notes.map(note => { const role = loopRole(note); return plan.roles.includes("danger") && role === "action" && ["dodge", "jump"].includes(note.effect.mode) ? "danger" : role; });
    const picked = notes.map((note, i) => i).filter(i => roles[i] ? plan.roles.includes(roles[i]) : plan.cols.includes(notes[i].col));
    /* the hero only joins the challenge loop when something can hurt it */
    const members = plan.roles.includes("danger") && !picked.some(i => roles[i] === "danger") ? [] : picked;
    const rank = i => roles[i] && plan.roles.includes(roles[i]) ? plan.roles.indexOf(roles[i]) : plan.roles.length;
    return { name: plan.name, notes: members.sort((a, b) => rank(a) - rank(b)) };
  }).filter(loop => loop.notes.length >= 2);
}

export function projectLoops(project) {
  return project.designMap.loops || [];
}
/* projects saved before loops existed get the suggested ones from the notes they already have */
export function ensureLoops(project) {
  if (Array.isArray(project.designMap.loops)) return project.designMap.loops;
  return setLoops(project, suggestLoops(project.stickers).map(loop => ({ name: loop.name, notes: loop.notes.map(i => project.stickers[i].id) })));
}
export function setLoops(project, loops) {
  project.designMap.loops = loops.map(loop => ({ id: nextId(), name: loop.name, notes: [...new Set(loop.notes)] }));
  return project.designMap.loops;
}

export const findLoop = (project, id) => projectLoops(project).find(loop => loop.id === id) || null;
export function addLoop(project, name) {
  const loop = { id: nextId(), name: String(name || "").trim() || "New loop", notes: [] };
  (project.designMap.loops ||= []).push(loop);
  return loop;
}
export function renameLoop(project, id, name) {
  const loop = findLoop(project, id), text = String(name || "").trim().slice(0, 60);
  if (!loop || !text) return false;
  loop.name = text;
  return true;
}
export function removeLoop(project, id) {
  const before = projectLoops(project).length;
  project.designMap.loops = projectLoops(project).filter(loop => loop.id !== id);
  return project.designMap.loops.length < before;
}
export function addToLoop(project, id, stickerId) {
  const loop = findLoop(project, id);
  if (!loop || !project.stickers.some(s => s.id === stickerId) || loop.notes.includes(stickerId)) return false;
  loop.notes.push(stickerId);
  return true;
}
export function removeFromLoop(project, id, stickerId) {
  const loop = findLoop(project, id);
  if (!loop || !loop.notes.includes(stickerId)) return false;
  loop.notes = loop.notes.filter(note => note !== stickerId);
  return true;
}
/* the logic stickers between two notes of the same loop */
export function loopLinks(project, loop) {
  const inside = new Set(loop.notes);
  return noteLinks(project).filter(link => inside.has(link.from) && inside.has(link.to));
}
