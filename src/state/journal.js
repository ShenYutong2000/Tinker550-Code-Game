const ALIGNMENT_HINTS = {
  matched: "Matched my expectation",
  different: "Something was different",
  observed: "I recorded what I noticed",
};

export function createVersionJournal(steps, expected) {
  return {
    steps: steps.map(({ id, text, col }) => ({ stickerId: id, text, category: col })),
    expected: expected || null,
    createdAt: Date.now(),
  };
}

export function getJournalEntries(project) {
  const versions = Array.isArray(project.versions) ? project.versions : [];
  const entries = versions.map((version, index) => {
    const savedSteps = version.journal?.steps;
    const steps = Array.isArray(savedSteps) && savedSteps.length
      ? savedSteps
      : String(version.summary || version.items?.join(" · ") || "A playable version was created")
        .split(" · ").map(text => ({ text, category: null }));
    const prediction = project.prediction?.round === version.n ? project.prediction : null;
    return {
      version: version.n || index + 1,
      steps,
      expected: version.journal?.expected || prediction?.guess || null,
      assessment: version.assessment || null,
    };
  });

  const built = new Set(Array.isArray(project.lastBuilt) ? project.lastBuilt : []);
  const planned = (project.stickers || []).filter(sticker => sticker.status === "new" || !built.has(sticker.id));
  if (planned.length) entries.push({
    version: null,
    steps: planned.map(({ id, text, col }) => ({ stickerId: id, text, category: col })),
    expected: null,
    assessment: null,
  });
  return entries.reverse();
}

export function getAssessmentView(project, UI) {
  const version = project.versions?.[project.versions.length - 1];
  if (!version) return { state: "empty" };
  const prediction = project.prediction?.round === version.n ? project.prediction : null;
  const expected = version.journal?.expected || prediction?.guess || null;
  const assessment = version.assessment || null;
  if (assessment) return { state: "complete", expected: assessment.expected || expected, assessment };
  if (project.phase === "playtest" && UI.asked) return { state: "question", expected };
  if (project.phase === "playtest" && UI.paneOpen) return { state: "playing", expected };
  return { state: "ready", expected, canStart: true };
}

export function savePlaytestAssessment(project, { response, feeling, discovery }) {
  const version = project.versions?.[project.versions.length - 1];
  if (!version) return null;
  const prediction = project.prediction?.round === version.n ? project.prediction : null;
  const text = response.trim();
  const uncertain = /\b(not sure|don't know|do not know|unsure|maybe)\b|不确定|不知道/i.test(text);
  const match = /\b(match(?:ed)?|happen(?:ed)?|yes|exactly|worked|true)\b|符合|对上|发生了/i.test(text);
  const difference = /\b(differ(?:ent|ence)|didn.t|doesn.t|not|no|never|nothing|unexpected|wrong)\b|不同|没|没有|不符合/i.test(text);
  const assessment = {
    expected: version.journal?.expected || prediction?.guess || null,
    response: text,
    alignment: uncertain ? "observed" : difference ? "different" : match ? "matched" : "observed",
    feeling: feeling || null,
    discovery: discovery || null,
    completedAt: Date.now(),
  };
  version.assessment = assessment;
  return assessment;
}

export function alignmentLabel(alignment) {
  return ALIGNMENT_HINTS[alignment] || ALIGNMENT_HINTS.observed;
}
