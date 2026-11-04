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

function stickerNodeId(project, stickerId) {
  return project.designMap.nodes.find(node => node.stickerId === stickerId)?.id;
}

function reaches(edges, from, to) {
  const seen = new Set(), stack = [from];
  while (stack.length) {
    const id = stack.pop();
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of edges) if (edge.from === id) stack.push(edge.to);
  }
  return false;
}

/* a link says "when the first mechanism happens, then the second one does"; links stay inside one element */
export function linkMechanisms(project, fromStickerId, toStickerId) {
  if (!fromStickerId || !toStickerId || fromStickerId === toStickerId) return "self";
  const first = project.stickers.find(sticker => sticker.id === fromStickerId), second = project.stickers.find(sticker => sticker.id === toStickerId);
  const from = stickerNodeId(project, fromStickerId), to = stickerNodeId(project, toStickerId);
  if (!first || !second || !from || !to) return "missing";
  if (first.col !== second.col) return "other-element";
  const edges = project.designMap.edges;
  if (edges.some(edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) return "duplicate";
  if (reaches(edges, to, from)) return "loop";
  edges.push({ id: nextId(), from, to });
  return "linked";
}

export function unlinkMechanisms(project, edgeId) {
  const before = project.designMap.edges.length;
  project.designMap.edges = project.designMap.edges.filter(edge => edge.id !== edgeId);
  return project.designMap.edges.length < before;
}

/* lays out one element's mechanisms: linked ones become chains read left to right, the rest stand on their own */
export function mechanismFlow(project, col) {
  const mechanisms = project.stickers.filter(sticker => sticker.col === col);
  const nodeToSticker = new Map(mechanisms.map(sticker => [stickerNodeId(project, sticker.id), sticker]).filter(([nodeId]) => nodeId));
  const edges = project.designMap.edges.filter(edge => nodeToSticker.has(edge.from) && nodeToSticker.has(edge.to))
    .map(edge => ({ id: edge.id, from: nodeToSticker.get(edge.from).id, to: nodeToSticker.get(edge.to).id }));
  const group = new Map(mechanisms.map(sticker => [sticker.id, sticker.id]));
  const root = id => group.get(id) === id ? id : root(group.get(id));
  for (const edge of edges) group.set(root(edge.from), root(edge.to));
  const chains = [], solo = [];
  for (const sticker of mechanisms) {
    const key = root(sticker.id);
    if (!edges.some(edge => root(edge.from) === key)) { solo.push(sticker); continue; }
    if (chains.some(chain => chain.key === key)) continue;
    const members = mechanisms.filter(item => root(item.id) === key);
    const chainEdges = edges.filter(edge => root(edge.from) === key);
    const step = new Map();
    const stepOf = id => {
      if (!step.has(id)) step.set(id, Math.max(-1, ...chainEdges.filter(edge => edge.to === id).map(edge => stepOf(edge.from))) + 1);
      return step.get(id);
    };
    const rows = new Map();
    const nodes = members.map(item => {
      const column = stepOf(item.id), row = rows.get(column) || 0;
      rows.set(column, row + 1);
      return { sticker: item, column, row };
    });
    chains.push({ key, nodes, edges: chainEdges, columns: Math.max(...nodes.map(node => node.column)) + 1, rows: Math.max(...rows.values()) });
  }
  return { mechanisms, chains: chains.map(({ key, ...chain }) => chain), solo };
}
