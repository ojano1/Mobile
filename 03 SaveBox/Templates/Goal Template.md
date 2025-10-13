<%*
/*
 Goal Template
 - Works with your router ("🎯Goal - <core>")
 - Reads the prefix from the filename
 - Adds a frontmatter `done` property (false by default)
 - One goal per note, under "### My Goal"
*/

const title = (tp.file.title ?? "").trim();

// Extract "<prefix>" and "<core>" from "<prefix><core>"
// Example title: "🎯Goal - Launch v2"
const m = title.match(/^(.*?\bGoal\s*-\s*)(.+)$/i);
const prefix = m ? m[1] : "🎯Goal - ";
const core   = (m ? m[2] : title).trim();

const lines = [
  "---",
  "_goal_sync_state: false",
  "done: false",                // editable checkbox in Properties view
`created: ${tp.file.creation_date("DD MMM YYYY")}`,

  "status: Active",             // Active | Archived
  "priority: Medium",           // High | Medium | Low
  "due: ",                      // fill later
  "duration_hours: ",           // number
  "tags: []",                   // YAML array
  "---",
  "### My Goal",
  `- [ ] ${prefix}${core}`,
  "",
  "#### ✍️Description",
  "- ", // placeholder line for user to start typing description
  "---",
  "",
];
tR = lines.join("\n");
%>
> [!tip] Step 1️⃣: 🚀Create projects to realize this goal.
> - Think milestones, use verb, measurable amount, time duration (ideally 1 month max per project, split if needed).
> - Examples: “Set up a saving vault in 1 week”, “Save $250 each month”, “Build an expense tracker in 1 week”.
> - Create links to your project page using prefix `Project - `
### ✍️Type your projects here
[[Project - Example1]]
- 
___
> [!tip] Step 2️⃣: Work from the Project page
> - Open each project note.
> - Create tasks **in the project page**.
___
### 🔋My progress:
```dataviewjs
// Projects linked to this Goal — progress by total duration_hours
// One purple bar shows % of total hours completed. Host `done` = all checked.

(async () => {
  const hostPath = dv.current().file.path;

  // --- helpers ---
  const prRank = { High: 1, Medium: 2, Med: 2, Low: 3, A: 1, B: 2, C: 3, 1: 1, 2: 2, 3: 3 };
  const prShow = v => {
    if (v == null || v === "") return "";
    const s = String(v).trim();
    const map = { "1":"High","2":"Medium","3":"Low","A":"High","B":"Medium","C":"Low" };
    const key = s.toUpperCase();
    return map[key] || (s[0].toUpperCase() + s.slice(1).toLowerCase());
  };
  const toNumOrNull = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const fmtDue = v => v ? window.moment(v).format("DD MMM YYYY") : null;

  // --- candidates: Project notes linking to this Goal ---
  const pages = dv.pages()
    .where(p => !/Archive|Template/i.test(p.file.path))
    .where(p => /Project/i.test(p.file.name) && !/[!]\s*$/.test(p.file.name))
    .where(p => {
      const ins = (p.file.inlinks ?? []).some(l => l.path === hostPath);
      const outs = (p.file.outlinks ?? []).some(l => l.path === hostPath);
      return ins || outs;
    });

  // --- pick first task under "My Project" ---
  const rows = [];
  for (const p of pages) {
    const tasks = (p.file.tasks || []).filter(t => t.section?.subpath === "My Project");
    if (!tasks.length) continue;
    const first = tasks.sort((a, b) => a.line - b.line)[0];

    const checked = typeof p.done === "boolean" ? p.done : !!first.completed;
    const due = first.due ?? p.due ?? p.due_date ?? null;
    const pri = prShow(p.priority ?? p.prio ?? null);
    const durNum = toNumOrNull(p.duration_hours ?? p.duration ?? null); // <-- use duration_hours

    rows.push({
      path: p.file.path,
      name: p.file.name,
      text: first.text,
      checked,
      dueStr: fmtDue(due),
      dueKey: due ? window.moment(due).valueOf() : Number.POSITIVE_INFINITY,
      pri,
      priKey: prRank[(String(pri || "").split(" ")[0])] ?? 9,
      durNum,
      durKey: durNum == null ? 1e9 : durNum
    });
  }

  if (!rows.length) { dv.paragraph("Nothing here yet, go create some projects 🚀"); return; }

  // --- sort: Due, then Priority, then Duration ---
  rows.sort((a, b) => a.dueKey - b.dueKey || a.priKey - b.priKey || a.durKey - b.durKey);

  // --- progress bar: duration-weighted ---
  const listDiv = document.createElement("div");
  const progWrap = dv.el("div", "", { cls: "proj-progress" });

  const renderProgress = (checkedCount, totalCount, doneDur, totalDur) => {
    const pct = totalDur > 0
      ? Math.round((doneDur / totalDur) * 100)
      : Math.round((checkedCount / Math.max(totalCount,1)) * 100); // fallback if no durations
    progWrap.innerHTML = `
      <div class="proj-progress-row" title="${doneDur}/${totalDur} hrs done">
        <div class="proj-bar-track">
          <div class="proj-bar-fill" style="width:${pct}%;"></div>
        </div>
        <div class="proj-pct-text">${pct}<span class="proj-pct-symbol">%</span></div>
      </div>
    `;
  };

  // initial numbers
  let totalDur = rows.reduce((s, r) => s + (r.durNum ?? 0), 0);
  let doneDur  = rows.reduce((s, r) => s + ((r.checked ? (r.durNum ?? 0) : 0)), 0);
  renderProgress(rows.filter(r => r.checked).length, rows.length, doneDur, totalDur);

  // --- host done <- current UI state and update bar
  const updateFromUI = async () => {
    const boxes = listDiv.querySelectorAll('input[type="checkbox"][data-dur]');
    const checkedNow = Array.from(boxes).filter(x => x.checked).length;
    const doneDurNow = Array.from(boxes).reduce((s, x) => s + (x.checked ? Number(x.dataset.dur) : 0), 0);
    const totalDurNow = Array.from(boxes).reduce((s, x) => s + Number(x.dataset.dur), 0);

    // host YAML `done` when all checked
    const hostFile = app.vault.getAbstractFileByPath(hostPath);
    if (hostFile) {
      await app.fileManager.processFrontMatter(hostFile, fm => { fm.done = (checkedNow === boxes.length && boxes.length > 0); });
    }

    renderProgress(checkedNow, boxes.length, doneDurNow, totalDurNow);
  };

  // --- render rows (grid, checkbox + inline meta) ---
  for (const r of rows) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "auto 1fr";
    row.style.alignItems = "start";
    row.style.columnGap = "8px";
    row.style.rowGap = "0";
    row.style.padding = "2px 0";
    row.style.minWidth = "0";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = r.checked;
    cb.dataset.dur = String(r.durNum ?? 0); // <-- duration for progress
    cb.style.margin = "0";

    const content = document.createElement("div");
    content.style.minWidth = "0";
    content.style.lineHeight = "1.35";

    const link = document.createElement("a");
    link.textContent = r.text;
    link.href = "#";
    link.style.minWidth = "0";
    link.onclick = e => {
      e.preventDefault();
      app.workspace.openLinkText(r.path, dv.current().file.path, false);
    };

    const meta = document.createElement("span");
    meta.style.opacity = "0.8";
    meta.style.marginLeft = "8px";
    const bits = [];
    if (r.dueStr) bits.push(`Due ${r.dueStr}`);
    if (r.pri) bits.push(r.pri);
    if (r.durNum != null) bits.push(`${r.durNum} hr${r.durNum === 1 ? "" : "s"}`);
    meta.textContent = bits.length ? "· " + bits.join(" · ") : "";

    const doneMark = document.createElement("span");
    doneMark.textContent = " ✅";
    doneMark.style.marginLeft = "6px";
    doneMark.style.display = r.checked ? "inline" : "none";

    content.append(link, meta, doneMark);
    row.append(cb, content);
    listDiv.appendChild(row);

    const applyDoneStyle = done => {
      link.style.textDecoration = done ? "line-through" : "none";
      meta.style.display = done ? "none" : "inline";
      doneMark.style.display = done ? "inline" : "none";
    };
    applyDoneStyle(r.checked);

    cb.addEventListener("change", async () => {
      const f = app.vault.getAbstractFileByPath(r.path);
      if (f) await app.fileManager.processFrontMatter(f, fm => { fm.done = cb.checked; });
      applyDoneStyle(cb.checked);
      await updateFromUI();
    });
  }

  // initial sync
  await updateFromUI();

  // --- styles ---
  const style = document.createElement("style");
  style.textContent = `
.proj-progress { margin:.5rem 0 .75rem; max-width:560px; }
.proj-progress-row { display:grid; grid-template-columns:1fr auto; align-items:center; gap:10px; }
.proj-bar-track {
  position:relative; height:14px; border-radius:10px; overflow:hidden;
  background: color-mix(in srgb, var(--background-modifier-border) 35%, transparent);
}
.proj-bar-fill {
  position:absolute; top:0; left:0; bottom:0; border-radius:10px;
  background:#7c3aed; /* purple */
}
.proj-pct-text { display:flex; align-items:baseline; gap:1px; font-weight:600; font-size:1.05em; white-space:nowrap; }
.proj-pct-symbol { font-size:.8em; line-height:1; }
`;
  dv.container.append(style);

  // mount
  dv.container.append(progWrap, listDiv);
})();
```
___
> [!tip] Step 3️⃣: (Optional) Create done criteria
> - Outcome, amount, or result
> - Deadline
> - How you will verify

#### ✅Done Criteria:
- 
___
### 🔗Links:
-
~~~dataviewjs
// 📅 Daily + Mind Map on top, then linked/backlink notes (A–Z)
// For Task/Project/Goal: show Done / Not Done instead of date

const M = window.moment;
const todayStr = M().format("DD MMM YYYY");
const cur = dv.current().file ?? {};
const curPath = cur.path ?? "";

// --- Top lines ---
const todays = dv.pages().where(p =>
  p.file &&
  !/Archive|Templates/i.test(p.file.folder || "") &&
  (p.file.name || "").includes(todayStr)
);
const daily = todays.length ? todays[0].file.link : "None";
dv.el("div", `📅 ${daily} • Today's daily note`, { cls: "note-line" });
dv.el("div", `[[🧠Mind Map]] • Bird's-eye view`, { cls: "note-line" });

// --- Helpers ---
const normalizeLinks = links =>
  (links ?? []).map(l => typeof l === "string" ? l : l?.path).filter(Boolean);

const createdOf = p => {
  if (p?.created) {
    const m = M(p.created, ["DD MMM YYYY", "YYYY-MM-DD"], true);
    if (m.isValid()) return m;
  }
  return M(p?.file?.ctime);
};

const isTPG = name => /(Task|Project|Goal)/i.test(name || "");
const isDone = p => {
  if (typeof p?.done === "boolean") return p.done;
  const tasks = p?.file?.tasks ?? [];
  return tasks.length ? tasks.every(t => t.completed) : false;
};

// --- Collect linked + backlinks ---
const curOut = new Set(normalizeLinks(cur.outlinks));

const base = dv.pages().where(p => {
  const f = p?.file;
  if (!f) return false;
  const folder = f.folder ?? "";
  const name = f.name ?? "";
  if (/Archive|Templates/i.test(folder)) return false;
  if (!/(note|task|project|goal)/i.test(name)) return false;
  if (name.includes("!")) return false;
  if (f.path === curPath) return false;
  return true;
});

// outlinks to or from current
const linked = base
  .where(p => {
    const path = p.file.path;
    const pOut = normalizeLinks(p.file.outlinks);
    return pOut.includes(curPath) || curOut.has(path);
  })
  .array();

// backlinks from anywhere
const backlinks = dv.pages()
  .where(p =>
    p.file?.outlinks?.some(l => l.path === curPath) &&
    !/Archive|Templates/i.test(p.file.folder || "")
  )
  .array();

// unique, sort A–Z by name
const unique = Array.from(new Map([...linked, ...backlinks].map(p => [p.file.path, p])).values())
  .sort((a, b) => (a.file.name || "").localeCompare(b.file.name || "", undefined, { sensitivity: "base" }));

// --- Render if any ---
if (unique.length) {
  const items = unique.map(p => {
    const name = p.file.name || "";
    if (isTPG(name)) {
      return `${p.file.link} • ${isDone(p) ? "Done" : "Not Done"}`;
    } else {
      return `${p.file.link} • ${createdOf(p).format("DD MMM YYYY")}`;
    }
  });
  dv.el("div", items.join("<br>"), { cls: "note-list" });
}

// --- Styles (balanced) ---
const style = document.createElement("style");
style.textContent = `
.note-line { margin: 3px 0 !important; padding: 0 !important; line-height: 1.4; }
.note-list { margin-top: 6px !important; padding: 0 !important; line-height: 1.4; }
.note-list br { line-height: 1.4; }
`;
dv.container.append(style);
~~~
___
<p align="center">Template created by Akhmad Fauzan<br>©️All rights reserved</p>