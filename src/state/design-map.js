export const MAP_WIDTH = 2200;
export const MAP_HEIGHT = 1400;
export const MAP_NOTE_WIDTH = 220;

let nextMapId = 0;
const nextId = () => `note-${Date.now().toString(36)}-${(++nextMapId).toString(36)}`;

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
    node.stickerId = sticker.id;
    node.title = sticker.text;
    node.status = mapStatus(project, sticker);
    return node;
  }
  const index = project.designMap.nodes.length;
  const created = {
    id: `card-${sticker.id}`,
    stickerId: sticker.id,
    title: sticker.text,
    x: 90 + (index % 3) * 300,
    y: 90 + Math.floor(index / 3) * 230,
    status: mapStatus(project, sticker)
  };
  project.designMap.nodes.push(created);
  return created;
}

export function syncStickerNodes(project) {
  for (const sticker of project.stickers || []) ensureStickerNode(project, sticker);
  for (const node of project.designMap.nodes) {
    node.x = Math.max(0, Math.min(MAP_WIDTH - MAP_NOTE_WIDTH, Number.isFinite(Number(node.x)) ? Math.round(Number(node.x)) : 90));
    node.y = Math.max(0, Math.min(MAP_HEIGHT - 190, Number.isFinite(Number(node.y)) ? Math.round(Number(node.y)) : 90));
    if (node.stickerId) {
      const sticker = project.stickers.find(item => item.id === node.stickerId);
      if (sticker) {
        node.title = sticker.text;
        node.status = mapStatus(project, sticker);
      }
    } else {
      node.title = String(node.title || "New idea…");
      node.color = ["sunshine", "coral", "mint", "sky", "lavender"].includes(node.color) ? node.color : "sunshine";
    }
  }
  const validIds = new Set((project.stickers || []).map(sticker => sticker.id));
  const removed = new Set(project.designMap.nodes
    .filter(node => node.stickerId && !validIds.has(node.stickerId))
    .map(node => node.id));
  project.designMap.nodes = project.designMap.nodes.filter(node => !removed.has(node.id));
  project.designMap.edges = project.designMap.edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
}

export function setStickerNodeStatus(project, stickerId, status) {
  const node = project.designMap?.nodes.find(item => item.stickerId === stickerId);
  if (node) node.status = status;
}

export function removeStickerNode(project, stickerId) {
  const removed = new Set(project.designMap.nodes.filter(node => node.stickerId === stickerId).map(node => node.id));
  project.designMap.nodes = project.designMap.nodes.filter(node => !removed.has(node.id));
  project.designMap.edges = project.designMap.edges.filter(edge => !removed.has(edge.from) && !removed.has(edge.to));
}

export function createIdeaNode(project, title, x, y, color = "sunshine") {
  const node = {
    id: nextId(),
    title,
    x: Math.max(0, Math.min(MAP_WIDTH - MAP_NOTE_WIDTH, Math.round(x))),
    y: Math.max(0, Math.min(MAP_HEIGHT - 190, Math.round(y))),
    color,
    status: "idea"
  };
  project.designMap.nodes.push(node);
  return node;
}

export function updateIdeaTitle(project, nodeId, title) {
  const node = project.designMap.nodes.find(item => item.id === nodeId && !item.stickerId);
  if (!node) return false;
  node.title = title;
  return true;
}

export function moveMapNode(project, nodeId, x, y) {
  const node = project.designMap.nodes.find(item => item.id === nodeId);
  if (!node) return false;
  node.x = Math.max(0, Math.min(MAP_WIDTH - MAP_NOTE_WIDTH, Math.round(x)));
  node.y = Math.max(0, Math.min(MAP_HEIGHT - 190, Math.round(y)));
  return true;
}

export function deleteIdeaNode(project, nodeId) {
  const node = project.designMap.nodes.find(item => item.id === nodeId);
  if (!node || node.stickerId) return false;
  project.designMap.nodes = project.designMap.nodes.filter(item => item.id !== nodeId);
  project.designMap.edges = project.designMap.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId);
  return true;
}

export function connectMapNodes(project, from, to) {
  if (!from || !to || from === to) return "self";
  const exists = project.designMap.edges.some(edge =>
    (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  );
  if (exists) return "duplicate";
  if (!project.designMap.nodes.some(node => node.id === from) || !project.designMap.nodes.some(node => node.id === to)) return "missing";
  project.designMap.edges.push({ id: nextId(), from, to });
  return "connected";
}
