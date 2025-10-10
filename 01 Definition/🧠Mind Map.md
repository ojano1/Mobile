~~~dataviewjs
/***** CONFIG *****/
const ROOT = "03 SaveBox/Active";
const FIELD = "duration_hours";
const DECIMALS = 2;
const WRITE_BACK = true;
const NO_DATA_MSG = "No data yet or restart Obsidian to reload";

/***** SAFE METAEDIT DETECTION *****/
const IS_MOBILE = app?.isMobile === true;
const ME = app?.plugins?.plugins?.metaedit?.api;
const CAN_WRITE = WRITE_BACK && !IS_MOBILE && ME && typeof ME.update === "function";

/***** HELPERS *****/
const inRoot = p => (p.file?.folder || "").startsWith(ROOT);
const norm = s => (s||"").replace(/#.*$/,"").replace(/\.md$/i,"").replace(/–/g,"-").replace(/\s+/g," ").trim().toLowerCase();
const pagePath = p => norm(p.file.path);
const linkPath = l => {
  const raw = typeof l === "string" ? l : (l?.path ?? l?.file?.path ?? "");
  const pg = dv.page(raw);
  return pg ? pagePath(pg) : norm(raw);
};
const linked = (a,b) => {
  const aOut = new Set((a.file?.outlinks||[]).map(linkPath));
  const bOut = new Set((b.file?.outlinks||[]).map(linkPath));
  return aOut.has(pagePath(b)) || bOut.has(pagePath(a));
};
const num = v => {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/[^0-9.\-]/g,""));
  return Number.isFinite(n) ? n : NaN;
};
const firstTaskDone = p => {
  const t = p.file?.tasks ?? [];
  return t.length > 0 && !!t[0].completed;
};
const allTasksDone = p => {
  const t = p.file?.tasks ?? [];
  return t.length > 0 && t.every(x => x.completed);
};
const tagsOf = pg => {
  const set = new Set();
  (pg?.file?.tags ?? pg?.tags ?? []).forEach(t => t && set.add(String(t).replace(/^#/,"")));
  const fmTags = pg?.file?.frontmatter?.tags;
  if (fmTags) {
    if (Array.isArray(fmTags)) fmTags.forEach(t => t && set.add(String(t).replace(/^#/,"")));
    else set.add(String(fmTags).replace(/^#/,""));
  }
  return Array.from(set);
};
const tagStr = p => {
  const tags = tagsOf(dv.page(p.file.path));
  return tags.length ? tags.map(t => `#${t}`).join(" ") : "";
};

/***** DATASETS *****/
const all      = dv.pages().where(inRoot);
const areas    = all.where(p => p.file.name.toLowerCase().includes("area")).sort(p => p.file.name);
const goals    = all.where(p => p.file.name.toLowerCase().includes("goal")).sort(p => p.file.name);
const projects = all.where(p => p.file.name.toLowerCase().includes("project")).sort(p => p.file.name);
const taskNotes= all.where(p => p.file.name.toLowerCase().includes("task")).sort(p => p.file.name);

/***** PROGRESS *****/
function projectChildren(proj){
  return taskNotes.where(x => linked(proj,x));
}
function projectProgress(proj){
  const kids = projectChildren(proj).array();
  const vals = kids.map(k => ({ d: num(k[FIELD]), allDone: allTasksDone(k) }))
                   .filter(x => Number.isFinite(x.d));
  const total = vals.reduce((a,b)=>a+b.d, 0);
  const doneH = vals.filter(x => x.allDone).reduce((a,b)=>a+b.d, 0);
  const pct = (vals.length === 0 || total <= 0)
    ? null
    : (vals.every(v => v.allDone) ? 100 : Math.round((doneH/total)*100));
  return { total: Number(total.toFixed(DECIMALS)), pct };
}

function goalChildren(goal){
  return projects.where(x => linked(goal,x));
}
function goalProgress(goal){
  const kids = goalChildren(goal).array();
  let total = 0, doneH = 0, hasData = false, allHundred = true;

  for (const p of kids) {
    const { total: pTot, pct } = projectProgress(p);
    if (Number.isFinite(pTot) && pTot > 0) {
      hasData = true;
      total += pTot;
      if (pct === 100) doneH += pTot;
      else if (pct != null) doneH += pTot * (pct/100);
    } else allHundred = false;
    if (pct !== 100) allHundred = false;
  }

  if (!hasData || total <= 0) return { total: null, pct: null };
  const pct = allHundred ? 100 : Math.round((doneH/total)*100);
  return { total: Number(total.toFixed(DECIMALS)), pct };
}

/***** WRITE BACK *****/
async function ensureField(page, value){
  if (!CAN_WRITE) return;
  if (value == null) return;
  const cur = num(page[FIELD]);
  if (!Number.isFinite(cur) || Math.abs(cur - value) > Math.pow(10, -DECIMALS)) {
    try { await ME.update(FIELD, value, page.file.path); }
    catch (_) { /* keep rendering even if MetaEdit fails */ }
  }
}

/***** RENDER *****/
let out = [];

for (const a of areas) {
  const tags = tagStr(a);
  out.push(`- ${a.file.link}${tags ? " " + tags : ""}`);

  for (const g of goals.where(x => linked(a,x))) {
    const { total: gTot, pct: gPct } = goalProgress(g);
    await ensureField(g, gTot ?? null);

    const tagsG = tagStr(g);
    const pctStrG = (gPct != null && gPct !== 0 && gPct !== 100) ? ` ${gPct}%` : "";
    const linkG = `${g.file.link}`;
    const doneMarkG = gPct === 100 ? " ✅🎉" : "";
    const labelG = gPct === 100
      ? `~~${linkG}~~${tagsG ? " " + tagsG : ""}${doneMarkG}`
      : `${linkG}${tagsG ? " " + tagsG : ""}${pctStrG}`;
    out.push(`  - ${labelG}`);

    for (const p of projects.where(x => linked(g,x))) {
      const { total: pTot, pct: pPct } = projectProgress(p);
      await ensureField(p, pTot ?? null);

      const tagsP = tagStr(p);
      const pctStrP = (pPct != null && pPct !== 0 && pPct !== 100) ? ` ${pPct}%` : "";
      const linkP = `${p.file.link}`;
      const doneMarkP = pPct === 100 ? " ✅" : "";
      const labelP = pPct === 100
        ? `~~${linkP}~~${tagsP ? " " + tagsP : ""}${doneMarkP}`
        : `${linkP}${tagsP ? " " + tagsP : ""}${pctStrP}`;
      out.push(`    - ${labelP}`);

      for (const t of taskNotes.where(x => linked(p,x))) {
        const tagsT = tagStr(t);
        const linkT = `${t.file.link}`;
        const firstDone = firstTaskDone(t);
        const labelT = firstDone
          ? `~~${linkT}~~${tagsT ? " " + tagsT : ""} ✅`
          : `${linkT}${tagsT ? " " + tagsT : ""}`;
        out.push(`      - ${labelT}`);
      }
    }
  }
}

/***** SHOW OUTPUT *****/
dv.paragraph(out.length === 0 ? NO_DATA_MSG : out.join("\n"));
~~~

~~~dataviewjs
/***** CONFIG *****/
const ROOT = "03 SaveBox/Active";
const FIELD = "duration_hours";
const DECIMALS = 2;
const WRITE_BACK = true;
const NO_DATA_MSG = "No data yet or restart Obsidian to reload";

/***** SAFE EDIT DETECTION *****/
const IS_MOBILE = app?.isMobile === true;
const ME = app?.plugins?.plugins?.metaedit?.api;
const THIS_PATH = dv?.current()?.file?.path ?? "";
const ACTIVE_PATH = app?.workspace?.getActiveFile?.()?.path ?? "";
const IS_ACTIVE_VIEW = THIS_PATH && ACTIVE_PATH && THIS_PATH === ACTIVE_PATH;
const CAN_WRITE = WRITE_BACK && IS_ACTIVE_VIEW && !IS_MOBILE;

/***** HELPERS *****/
const inRoot = p => (p.file?.folder || "").startsWith(ROOT);
const notBang = p => !String(p.file?.name || "").includes("!");
const allowed = p => inRoot(p) && notBang(p);

const norm = s => (s||"").replace(/#.*$/,"").replace(/\.md$/i,"").replace(/–/g,"-").replace(/\s+/g," ").trim().toLowerCase();
const pagePath = p => norm(p.file.path);
const linkPath = l => {
  const raw = typeof l === "string" ? l : (l?.path ?? l?.file?.path ?? "");
  const pg = dv.page(raw);
  return pg ? pagePath(pg) : norm(raw);
};
const linked = (a,b) => {
  const aOut = new Set((a.file?.outlinks||[]).map(linkPath));
  const bOut = new Set((b.file?.outlinks||[]).map(linkPath));
  return aOut.has(pagePath(b)) || bOut.has(pagePath(a));
};
const num = v => {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/[^0-9.\-]/g,""));
  return Number.isFinite(n) ? n : NaN;
};
const stripZeros = v => Number(v.toFixed(DECIMALS));
const fmtH = v => {
  if (!Number.isFinite(v)) return "";
  const q = stripZeros(v);
  const unit = q === 1 ? "hr" : "hrs";
  return `${q} ${unit}`;
};
const chip = txt => `<span class="duration-chip">${txt}</span>`;

/* completion rule: a task note counts as done if its first checklist item is done */
const firstTaskDone = p => {
  const t = p.file?.tasks ?? [];
  return t.length > 0 && !!t[0].completed;
};

/* tags */
const tagsOf = pg => {
  const set = new Set();
  (pg?.file?.tags ?? pg?.tags ?? []).forEach(t => t && set.add(String(t).replace(/^#/,"")));
  const fmTags = pg?.file?.frontmatter?.tags;
  if (fmTags) {
    if (Array.isArray(fmTags)) fmTags.forEach(t => t && set.add(String(t).replace(/^#/,"")));
    else set.add(String(fmTags).replace(/^#/,""));
  }
  return Array.from(set);
};
const tagStr = p => {
  const tags = tagsOf(dv.page(p.file.path));
  return tags.length ? tags.map(t => `#${t}`).join(" ") : "";
};

/***** DATASETS *****/
const all      = dv.pages().where(allowed);
const areas    = all.where(p => p.file.name.toLowerCase().includes("area")).sort(p => p.file.name);
const goals    = all.where(p => p.file.name.toLowerCase().includes("goal")).sort(p => p.file.name);
const projects = all.where(p => p.file.name.toLowerCase().includes("project")).sort(p => p.file.name);
const taskNotes= all.where(p => p.file.name.toLowerCase().includes("task")).sort(p => p.file.name);

/***** CHILDREN HELPERS *****/
const projectChildren = proj => taskNotes.where(x => linked(proj,x));
const goalChildren    = goal => projects.where(x => linked(goal,x));

const projectAllChildrenDone = proj => {
  const kids = projectChildren(proj).array();
  return kids.length > 0 && kids.every(k => firstTaskDone(k));
};
const goalAllChildrenDone = goal => {
  const kids = goalChildren(goal).array();
  return kids.length > 0 && kids.every(p => projectAllChildrenDone(p));
};

/***** PROGRESS BY HOURS *****/
function projectProgress(proj){
  const vals = projectChildren(proj).array()
    .map(k => ({ d: num(k[FIELD]), done: firstTaskDone(k) }))
    .filter(x => Number.isFinite(x.d) && x.d > 0);
  const total = vals.reduce((a,b)=>a+b.d, 0);
  const doneH = vals.filter(x => x.done).reduce((a,b)=>a+b.d, 0);
  if (total <= 0) return { total: null, pct: null };
  const pct = Math.round((doneH/total)*100);
  return { total: stripZeros(total), pct };
}

function goalProgress(goal){
  const kids = goalChildren(goal).array();
  let total = 0, done = 0, any = false;
  for (const p of kids) {
    const { total: pTot, pct } = projectProgress(p);
    if (Number.isFinite(pTot) && pTot > 0) {
      any = true;
      total += pTot;
      if (pct != null) done += pTot * (pct/100);
    }
  }
  if (!any || total <= 0) return { total: null, pct: null };
  const pct = Math.round((done/total)*100);
  return { total: stripZeros(total), pct };
}

/***** WRITE BACK *****/
async function ensureField(page, value){
  if (!CAN_WRITE || !ME) return;
  if (value == null) return;
  const cur = num(page[FIELD]);
  if (!Number.isFinite(cur) || Math.abs(cur - value) > Math.pow(10, -DECIMALS)) {
    try { await ME.update(FIELD, value, page.file.path); } catch(_) {}
  }
}

/* Robust checkbox sync: handles callouts, emoji, “Project -”/“Goal -” */
const PROJECT_PREFIX_RE = /project\s*-\s*/i; // also matches 🚀Project -
const GOAL_PREFIX_RE    = /goal\s*-\s*/i;

function findCheckboxIndex(lines){
  // Prefer a line with checkbox + Project/Goal hint
  let idx = lines.findIndex(ln =>
    />*\s*-\s*\[(?: |x)\]\s*/i.test(ln) &&
    (PROJECT_PREFIX_RE.test(ln) || GOAL_PREFIX_RE.test(ln))
  );
  if (idx !== -1) return idx;

  // Fallback: first checkbox anywhere in the top 80 lines
  const limit = Math.min(lines.length, 80);
  for (let i = 0; i < limit; i++){
    if (/>*\s*-\s*\[(?: |x)\]\s*/i.test(lines[i])) return i;
  }
  return -1;
}

async function ensureResultCheckbox(page, done){
  if (!CAN_WRITE) return;
  try {
    const path = page.file.path;
    const f = app.vault.getAbstractFileByPath(path);
    if (!f) return;
    const orig = await app.vault.read(f);
    const lines = orig.split(/\r?\n/);

    const idx = findCheckboxIndex(lines);
    if (idx === -1) return;

    const line = lines[idx];
    const isDone = /\-\s*\[x\]\s*/i.test(line);
    const wantDone = !!done;

    if (isDone === wantDone) return;

    // Toggle only the checkbox token, preserve callout and content
    lines[idx] = wantDone
      ? line.replace(/-\s*\[\s\]/i, "- [x]")
      : line.replace(/-\s*\[x\]/i, "- [ ]");

    const next = lines.join("\n");
    if (next !== orig) await app.vault.modify(f, next);
  } catch(_) {}
}

/***** RENDER *****/
let out = [];
out.push(`<style>
.duration-chip{
  display:inline-block;
  padding:0 6px;
  border-radius:12px;
  line-height:1.6;
  font-size:0.9em;
  background-color: var(--interactive-accent-hover);
  color: var(--background-primary);
}
.grey-link a{ color: var(--text-faint) !important; }
</style>`);

for (const a of areas) {
  const tags = tagStr(a);
  out.push(`- ${a.file.link}${tags ? " " + tags : ""}`);

  for (const g of goals.where(x => linked(a,x))) {
    const { total: gTot, pct: gPct } = goalProgress(g);
    await ensureField(g, gTot ?? null);

    const doneG = goalAllChildrenDone(g);
    await ensureResultCheckbox(g, doneG);

    const tagsG = tagStr(g);
    const durG  = Number.isFinite(gTot) && gTot > 0 ? chip(fmtH(gTot)) : "";
    const pctG  = (gPct != null && gPct > 0 && gPct < 100) ? ` ${gPct}%` : "";
    const metaG = (durG || pctG) ? ` ${durG}${pctG}` : "";

    const labelG = doneG
      ? `<span class="grey-link">~~${g.file.link}~~ ✅</span>`
      : `${g.file.link}${metaG}${tagsG ? " " + tagsG : ""}`;
    out.push(`  - ${labelG}`);

    for (const p of projects.where(x => linked(g,x))) {
      const { total: pTot, pct: pPct } = projectProgress(p);
      await ensureField(p, pTot ?? null);

      const doneP = projectAllChildrenDone(p);
      await ensureResultCheckbox(p, doneP);

      const tagsP = tagStr(p);
      const durP  = Number.isFinite(pTot) && pTot > 0 ? chip(fmtH(pTot)) : "";
      const pctP  = (pPct != null && pPct > 0 && pPct < 100) ? ` ${pPct}%` : "";
      const metaP = (durP || pctP) ? ` ${durP}${pctP}` : "";

      const labelP = doneP
        ? `<span class="grey-link">~~${p.file.link}~~ ✅</span>`
        : `${p.file.link}${metaP}${tagsP ? " " + tagsP : ""}`;
      out.push(`    - ${labelP}`);

      for (const t of taskNotes.where(x => linked(p,x))) {
        const tagsT = tagStr(t);
        const doneT = firstTaskDone(t);
        const tDur = num(t[FIELD]);
        const durT = Number.isFinite(tDur) && tDur > 0 ? ` ${chip(fmtH(tDur))}` : "";
        const labelT = doneT
          ? `<span class="grey-link">~~${t.file.link}~~ ✅</span>`
          : `${t.file.link}${durT}${tagsT ? " " + tagsT : ""}`;
        out.push(`      - ${labelT}`);
      }
    }
  }
}

/***** SHOW OUTPUT *****/
dv.paragraph(out.length === 0 ? NO_DATA_MSG : out.join("\n"));
~~~