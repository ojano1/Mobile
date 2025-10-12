
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
const firstTaskDone = p => {
  const t = p.file?.tasks ?? [];
  return t.length > 0 && !!t[0].completed;
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

/* foldable block helper */
function detailsBlock(title, inner, open=true){
  return `<details ${open ? "open":""}><summary>${title}</summary>

${inner}

</details>`;
}

/***** DATASETS *****/
const all      = dv.pages().where(allowed);
const areas    = all.where(p => p.file.name.toLowerCase().includes("area")).sort(p => p.file.name);
const goals    = all.where(p => p.file.name.toLowerCase().includes("goal")).sort(p => p.file.name);
const projects = all.where(p => p.file.name.toLowerCase().includes("project")).sort(p => p.file.name);
const tasks    = all.where(p => p.file.name.toLowerCase().includes("task")).sort(p => p.file.name);
const notes    = all.where(p => p.file.name.toLowerCase().includes("note")).sort(p => p.file.name);

/***** CHILDREN HELPERS *****/
const projectChildren = proj => tasks.where(x => linked(proj,x));
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
const PROJECT_PREFIX_RE = /project\s*-\s*/i;
const GOAL_PREFIX_RE    = /goal\s*-\s*/i;
function findCheckboxIndex(lines){
  let idx = lines.findIndex(ln =>
    />*\s*-\s*\[(?: |x)\]\s*/i.test(ln) &&
    (PROJECT_PREFIX_RE.test(ln) || GOAL_PREFIX_RE.test(ln))
  );
  if (idx !== -1) return idx;
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
    lines[idx] = wantDone
      ? line.replace(/-\s*\[\s\]/i, "- [x]")
      : line.replace(/-\s*\[x\]/i, "- [ ]");
    const next = lines.join("\n");
    if (next !== orig) await app.vault.modify(f, next);
  } catch(_) {}
}

/***** STYLE *****/
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
details{ margin:0 0 10px 0; }
details > summary{ cursor:pointer; font-weight:600; }
</style>`);

/***** LINKED STRUCTURE (foldable per Area) *****/
for (const a of areas) {
  const areaLines = [];
  const tags = tagStr(a);
  areaLines.push(`- ${a.file.link}${tags ? " " + tags : ""}`);

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
    areaLines.push(`  - ${labelG}`);

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
      areaLines.push(`    - ${labelP}`);

      for (const t of tasks.where(x => linked(p,x))) {
        const tagsT = tagStr(t);
        const doneT = firstTaskDone(t);
        const tDur = num(t[FIELD]);
        const durT = Number.isFinite(tDur) && tDur > 0 ? ` ${chip(fmtH(tDur))}` : "";
        const labelT = doneT
          ? `<span class="grey-link">~~${t.file.link}~~ ✅</span>`
          : `${t.file.link}${durT}${tagsT ? " " + tagsT : ""}`;
        areaLines.push(`      - ${labelT}`);
      }
    }
  }

  out.push(detailsBlock(`📁 ${a.file.name}`, areaLines.join("\n"), true));
}

/***** ORPHAN DETECTION *****/
const linkedProjects = new Set();
const linkedTasks    = new Set();
for (const g of goals) for (const p of projects) if (linked(g,p)) linkedProjects.add(p.file.path);
for (const p of projects) for (const t of tasks) if (linked(p,t)) linkedTasks.add(t.file.path);

const orphanGoals    = goals.where(g => projects.where(p => linked(g,p)).length === 0);
const orphanProjects = projects.where(p => !linkedProjects.has(p.file.path));
const orphanTasks    = tasks.where(t => !linkedTasks.has(t.file.path));

/***** ORPHAN GROUPS (foldable, emoji-titled) *****/
function renderOrphansBlock(titleWithEmoji, group){
  if (!group.length) return "";
  const lines = [];
  for (const item of group) {
    const tags = tagStr(item);
    const done = firstTaskDone(item);
    const dur  = num(item[FIELD]);
    const durChip = Number.isFinite(dur) && dur > 0 ? ` ${chip(fmtH(dur))}` : "";
    const label = done
      ? `<span class="grey-link">~~${item.file.link}~~ ✅</span>`
      : `${item.file.link}${durChip}${tags ? " " + tags : ""}`;
    lines.push(`- ${label}`);
  }
  return detailsBlock(titleWithEmoji, lines.join("\n"), true);
}

out.push(renderOrphansBlock("🎯 Orphan Goals", orphanGoals));
out.push(renderOrphansBlock("🚀 Orphan Projects", orphanProjects));
out.push(renderOrphansBlock("📌 Orphan Tasks", orphanTasks));

/***** NOTES GROUP (foldable) *****/
const notesBlock = (() => {
  if (!notes.length) return "";
  const lines = notes.map(n => {
    const tags = tagStr(n);
    return `- ${n.file.link}${tags ? " " + tags : ""}`;
  });
  return detailsBlock("✏️ Notes", lines.join("\n"), true);
})();
out.push(notesBlock);

/***** SHOW OUTPUT *****/
const finalOut = out.filter(Boolean).join("\n");
dv.paragraph(finalOut.length === 0 ? NO_DATA_MSG : finalOut);
~~~