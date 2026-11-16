import { COLS } from "../design/catalog.js";

let nextMapId = 0;
const nextId = () => `link-${Date.now().toString(36)}-${(++nextMapId).toString(36)}`;

function mapStatus(project, sticker) {
  if (sticker.status === "new") return "idea";
  return (project.lastBuilt || []).includes(sticker.id) ? "built" : "confirmed";
}

export function ensureStickerNode(project, sticker, previousStickerId) {
  project.designMap ||= { nodes: [], edges: [] };
  project.designMap.nodes ||= [];
  project.designMap.edges ||= [];
  const node = project.designMap.nodes.find(item =>
    item.stickerId === sticker.id || (previousStickerId && item.stickerId === previousStickerId)
  );
  if (node) {
    /* a rewritten note keeps its place in every loop */
    if (previousStickerId) for (const loop of project.designMap.loops || []) loop.notes = loop.notes.map(id => id === previousStickerId ? sticker.id : id);
    node.stickerId = sticker.id;
    node.title = sticker.text;
    node.status = mapStatus(project, sticker);
    return node;
  }
  const created = {
    id: `card-${sticker.id}`,
    stickerId: sticker.id,
    title: sticker.text,
    status: mapStatus(project, sticker)
  };
  project.designMap.nodes.push(created);
  return created;
}

export function syncStickerNodes(project) {
  for (const sticker of project.stickers || []) ensureStickerNode(project, sticker);
  for (const node of project.designMap.nodes) {
    const sticker = node.stickerId && project.stickers.find(item => item.id === node.stickerId);
    if (sticker) {
      node.title = sticker.text;
      node.status = mapStatus(project, sticker);
    }
  }
  const validIds = new Set((project.stickers || []).map(sticker => sticker.id));
  const removed = new Set(project.designMap.nodes
    .filter(node => node.stickerId && !validIds.has(node.stickerId))
    .map(node => node.id));
  project.designMap.nodes = project.designMap.nodes.filter(node => !removed.has(node.id));
  project.designMap.edges = project.designMap.edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
  for (const loop of project.designMap.loops || []) loop.notes = loop.notes.filter(id => validIds.has(id));
}

export function setStickerNodeStatus(project, stickerId, status) {
  const node = project.designMap?.nodes.find(item => item.stickerId === stickerId);
  if (node) node.status = status;
}

export function removeStickerNode(project, stickerId) {
  const removed = new Set(project.designMap.nodes.filter(node => node.stickerId === stickerId).map(node => node.id));
  project.designMap.nodes = project.designMap.nodes.filter(node => !removed.has(node.id));
  project.designMap.edges = project.designMap.edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
  for (const loop of project.designMap.loops || []) loop.notes = loop.notes.filter(id => id !== stickerId);
}

function stickerNodeId(project, stickerId) {
  return project.designMap.nodes.find(node => node.stickerId === stickerId)?.id;
}

/* the logic sticker library: a fixed set of kinds, each usable as often as a child likes.
   A link between two notes is one of these stickers; older links without a label read as "if → then".
   "runs" kinds become rules in the game's code; the others stay in the design as ideas. */
export const LOGIC_STICKERS = [
  { k: "then", label: "if → then", ic: "➡️", runs: true, tip: "When the first thing happens, the second thing happens" },
  { k: "ends", label: "ends when", ic: "🏁", runs: true, tip: "The first thing can end the game" },
  { k: "every", label: "every 5 s", ic: "⏰", runs: true, tip: "The second thing happens again every 5 seconds" },
  { k: "and", label: "and", ic: "➕", runs: false, tip: "Both things work together" },
  { k: "or", label: "or", ic: "🔀", runs: false, tip: "Either one can happen" },
  { k: "unless", label: "unless", ic: "🚫", runs: false, tip: "The second thing stops the first one" },
  { k: "more", label: "more → more", ic: "📈", runs: false, tip: "The more of the first, the more of the second" },
  { k: "uses", label: "uses", ic: "🎒", runs: false, tip: "The first thing needs the second" },
  { k: "controls", label: "controls", ic: "🕹️", runs: false, tip: "The first thing moves the second" }
];
export const LINK_LABELS = Object.fromEntries(LOGIC_STICKERS.map(sticker => [sticker.k, sticker.label]));
export function inferLabel(fromCol, toCol) {
  if (toCol === "outcome") return "ends";
  if (fromCol === "procedures" && toCol === "character") return "controls";
  if (toCol === "resources" || toCol === "procedures") return "uses";
  return "then";
}

/* links may join any two notes, inside one element or across elements */
export function connectNotes(project, fromStickerId, toStickerId, label) {
  if (!fromStickerId || !toStickerId || fromStickerId === toStickerId) return { result: "self" };
  const first = project.stickers.find(sticker => sticker.id === fromStickerId), second = project.stickers.find(sticker => sticker.id === toStickerId);
  const from = stickerNodeId(project, fromStickerId), to = stickerNodeId(project, toStickerId);
  if (!first || !second || !from || !to) return { result: "missing" };
  const edges = project.designMap.edges;
  if (edges.some(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) return { result: "duplicate" };
  const edge = { id: nextId(), from, to, label: LINK_LABELS[label] ? label : inferLabel(first.col, second.col) };
  edges.push(edge);
  return { result: "linked", edge };
}

export function setLinkLabel(project, edgeId, label) {
  const edge = project.designMap.edges.find(item => item.id === edgeId);
  if (!edge || !LINK_LABELS[label]) return false;
  edge.label = label;
  return true;
}

export function unlinkNotes(project, edgeId) {
  const before = project.designMap.edges.length;
  project.designMap.edges = project.designMap.edges.filter(edge => edge.id !== edgeId);
  return project.designMap.edges.length < before;
}

/* links in terms of notes rather than map nodes */
export function noteLinks(project) {
  const byNode = new Map(project.designMap.nodes.map(node => [node.id, node.stickerId]));
  return project.designMap.edges
    .map(edge => ({ id: edge.id, from: byNode.get(edge.from), to: byNode.get(edge.to), label: LINK_LABELS[edge.label] ? edge.label : "then" }))
    .filter(link => link.from && link.to);
}

/* what to highlight for a focused note or element: its own notes, notes linked to them directly,
   and everything further down the arrows that a change would ripple into */
export function focusSets(project, focus) {
  const links = noteLinks(project);
  const self = new Set(focus.note ? [focus.note] : project.stickers.filter(sticker => sticker.col === focus.col).map(sticker => sticker.id));
  const direct = new Set(), edges = new Set(), affected = new Set();
  for (const link of links) if (self.has(link.from) || self.has(link.to)) { edges.add(link.id); direct.add(link.from); direct.add(link.to); }
  const stack = [...self], seen = new Set(self);
  while (stack.length) {
    const id = stack.pop();
    for (const link of links) if (link.from === id && !seen.has(link.to)) { seen.add(link.to); affected.add(link.to); stack.push(link.to); }
  }
  const ripple = new Set(links.filter(link => !edges.has(link.id) && (self.has(link.from) || affected.has(link.from)) && affected.has(link.to)).map(link => link.id));
  for (const id of self) direct.delete(id);
  return { self, direct, edges, affected, ripple };
}

/* ---------- canvas layout: nine clusters, notes stacked inside each ---------- */
export const CLUSTER_W = 250, NOTE_H = 58, NOTE_GAP = 8, HEAD_H = 46, ADD_H = 30, PAD = 10, GAP_X = 96, GAP_Y = 64, MARGIN = 40;

export function clusterState(project, col) {
  return (project.designMap.clusters || {})[col] || {};
}

export function mapLayout(project) {
  const clusters = {}, notes = {};
  const heights = COLS.map(category => {
    const count = project.stickers.filter(sticker => sticker.col === category.key).length;
    return clusterState(project, category.key).collapsed ? HEAD_H : HEAD_H + Math.max(1, count) * (NOTE_H + NOTE_GAP) + ADD_H + PAD;
  });
  let top = MARGIN;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col, key = COLS[index].key, saved = clusterState(project, key);
      clusters[key] = {
        x: Number.isFinite(saved.x) ? saved.x : MARGIN + col * (CLUSTER_W + GAP_X),
        y: Number.isFinite(saved.y) ? saved.y : top,
        w: CLUSTER_W, h: heights[index], collapsed: !!saved.collapsed
      };
    }
    top += Math.max(...heights.slice(row * 3, row * 3 + 3)) + GAP_Y;
  }
  for (const category of COLS) {
    const box = clusters[category.key];
    project.stickers.filter(sticker => sticker.col === category.key).forEach((sticker, index) => {
      notes[sticker.id] = box.collapsed
        ? { x: box.x, y: box.y, w: box.w, h: HEAD_H, hidden: true }
        : { x: box.x + PAD, y: box.y + HEAD_H + index * (NOTE_H + NOTE_GAP), w: box.w - PAD * 2, h: NOTE_H };
    });
  }
  const boxes = Object.values(clusters);
  return { clusters, notes, width: Math.max(...boxes.map(box => box.x + box.w)) + MARGIN * 3,   // room for arrows that curve out to the right
     height: Math.max(...boxes.map(box => box.y + box.h)) + MARGIN };
}

function setCluster(project, col, values) {
  project.designMap.clusters ||= {};
  project.designMap.clusters[col] = { ...clusterState(project, col), ...values };
}

export function moveCluster(project, col, x, y) {
  setCluster(project, col, { x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)) });
}

export function toggleCluster(project, col) {
  setCluster(project, col, { collapsed: !clusterState(project, col).collapsed });
}

/* moves a note up or down inside its own element; other elements keep their order */
export function reorderNote(project, stickerId, toIndex) {
  const sticker = project.stickers.find(item => item.id === stickerId);
  if (!sticker) return false;
  const same = project.stickers.filter(item => item.col === sticker.col && item !== sticker);
  same.splice(Math.max(0, Math.min(same.length, toIndex)), 0, sticker);
  let next = 0;
  project.stickers = project.stickers.map(item => item.col === sticker.col ? same[next++] : item);
  return true;
}
