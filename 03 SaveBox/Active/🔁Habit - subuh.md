### 📅 30 Days Grid
```dataviewjs
// === Foldable Habit Grid (7 cols) + Streak + Completion % ===
// Reads habit tasks in this file.

const ANCHOR = "today"; // "today" or "latest"
const M = window.moment;
const toISO = d => M(d).format("YYYY-MM-DD");

// --- extract date from task text ---
function extractISO(s) {
  s = String(s).trim();
  let m = s.match(/(\d{4}-\d{2}-\d{2})(?:\s*\^\d{4}-\d{2}-\d{2})?\s*$/); if (m) return m[1];
  m = s.match(/due\((\d{4}-\d{2}-\d{2})\)/i);                             if (m) return m[1];
  m = s.match(/due::\s*(\d{4}-\d{2}-\d{2})/i);                           if (m) return m[1];
  m = s.match(/📅\s*(\d{4}-\d{2}-\d{2})/);                                if (m) return m[1];
  return null;
}

// --- collect tasks ---
const rawTasks = dv.current().file.tasks ?? [];
const tasks = rawTasks
  .map(t => ({ date: extractISO(t.text), done: !!t.completed }))
  .filter(t => t.date)
  .sort((a,b) => a.date.localeCompare(b.date));

if (!tasks.length) {
  dv.paragraph("No habit tasks found.");
} else {
  const state = new Map(tasks.map(t => [t.date, t.done]));

  // Window
  const latest = M(tasks[tasks.length - 1].date).startOf("day");
  const today  = M().startOf("day");
  const end    = (ANCHOR === "today") ? today : latest;
  const start  = end.clone().subtract(29, "days");
  const gridStart = start.clone().startOf("isoWeek");
  const gridEnd   = end.clone().endOf("isoWeek");

  // --- streak ---
  let streak = 0;
  {
    let d = end.clone();
    for (let i = 0; i < 30; i++) {
      const iso = toISO(d);
      if (state.get(iso)) streak++; else break;
      d.subtract(1, "day");
    }
  }

  // --- completion rate ---
  const recent = Array.from({length: 30}, (_,i) => toISO(start.clone().add(i,"days")));
  const doneCount = recent.filter(d => state.get(d)).length;
  const completionRate = ((doneCount / 30) * 100).toFixed(0);

  // --- render ---
  const wrap = dv.el("div", "", { cls: "weekly-streak-wrap" });
  wrap.createEl("p", { text: `🔥 Current streak: ${streak} day${streak===1?"":"s"} • 📊 ${completionRate}% complete` });

  // header
  const head = wrap.createDiv({ cls: "weekly-streak-head" });
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(h => head.createDiv({ cls: "head", text: h }));

  // grid
  const grid = wrap.createDiv({ cls: "weekly-streak-grid" });
  let d = gridStart.clone();
  while (d.isSameOrBefore(gridEnd)) {
    const iso = toISO(d);
    const inWindow = d.isSameOrAfter(start) && d.isSameOrBefore(end);
    const done = inWindow ? !!state.get(iso) : false;

    const cell = grid.createDiv({ cls: "weekly-streak-cell" });
    if (!inWindow) cell.classList.add("pad");
    if (done && inWindow) cell.classList.add("hit");

    cell.createDiv({ cls: "num", text: inWindow ? d.format("D")   : "" });
    cell.createDiv({ cls: "ddd", text: inWindow ? d.format("ddd") : "" });
    cell.setAttr("title", inWindow ? `${d.format("ddd, DD MMM YYYY")} ${done ? "✅ Done" : "❌ Missed"}` : "");

    d.add(1, "day");
  }

  // --- style ---
  const style = document.createElement("style");
  style.textContent = `
  .weekly-streak-wrap { margin-top:.5rem; }
  .weekly-streak-head {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width: 520px; margin-bottom:6px;
  }
  .weekly-streak-head .head {
    text-align:center; font-size:.75em; color: var(--text-faint);
  }
  .weekly-streak-grid {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width: 520px;
  }
  .weekly-streak-cell {
    aspect-ratio:1/1; border-radius:10px;
    background: var(--background-modifier-border);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }
  .weekly-streak-cell .num { font-weight:700; font-size:.9em; color: var(--text-muted); line-height:1; }
  .weekly-streak-cell .ddd { font-size:.7em; color: var(--text-faint); line-height:1; margin-top:2px; }
  .weekly-streak-cell.hit { background: var(--interactive-accent); }
  .weekly-streak-cell.hit .num, .weekly-streak-cell.hit .ddd { color:white; }
  .weekly-streak-cell.pad { opacity:.35; }
  `;
  wrap.appendChild(style);
}

```


~~~dataviewjs
// === Foldable Habit Grid (7 cols) + Streak + Completion % ===
// Latest date displayed at the top.

const ANCHOR = "latest"; // now uses "latest" as top anchor
const M = window.moment;
const toISO = d => M(d).format("YYYY-MM-DD");

// --- extract date from task text ---
function extractISO(s) {
  s = String(s).trim();
  let m = s.match(/(\d{4}-\d{2}-\d{2})(?:\s*\^\d{4}-\d{2}-\d{2})?\s*$/); if (m) return m[1];
  m = s.match(/due\((\d{4}-\d{2}-\d{2})\)/i);                             if (m) return m[1];
  m = s.match(/due::\s*(\d{4}-\d{2}-\d{2})/i);                           if (m) return m[1];
  m = s.match(/📅\s*(\d{4}-\d{2}-\d{2})/);                                if (m) return m[1];
  return null;
}

// --- collect tasks ---
const rawTasks = dv.current().file.tasks ?? [];
const tasks = rawTasks
  .map(t => ({ date: extractISO(t.text), done: !!t.completed }))
  .filter(t => t.date)
  .sort((a,b) => a.date.localeCompare(b.date));

if (!tasks.length) {
  dv.paragraph("No habit tasks found.");
} else {
  const state = new Map(tasks.map(t => [t.date, t.done]));

  const latest = M(tasks[tasks.length - 1].date).startOf("day");
  const today  = M().startOf("day");
  const end    = (ANCHOR === "today") ? today : latest;
  const start  = end.clone().subtract(29, "days");
  const gridStart = start.clone().startOf("isoWeek");
  const gridEnd   = end.clone().endOf("isoWeek");

  // --- streak ---
  let streak = 0;
  {
    let d = end.clone();
    for (let i = 0; i < 30; i++) {
      const iso = toISO(d);
      if (state.get(iso)) streak++; else break;
      d.subtract(1, "day");
    }
  }

  // --- completion rate ---
  const recent = Array.from({length: 30}, (_,i) => toISO(start.clone().add(i,"days")));
  const doneCount = recent.filter(d => state.get(d)).length;
  const completionRate = ((doneCount / 30) * 100).toFixed(0);

  // --- render ---
  const wrap = dv.el("div", "", { cls: "weekly-streak-wrap" });
  wrap.createEl("p", { text: `🔥 Current streak: ${streak} day${streak===1?"":"s"} • 📊 ${completionRate}% complete` });

  // header
  const head = wrap.createDiv({ cls: "weekly-streak-head" });
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(h => head.createDiv({ cls: "head", text: h }));

  // grid container
  const grid = wrap.createDiv({ cls: "weekly-streak-grid" });

  // Collect cells first (so we can reverse them)
  const cells = [];
  let d = gridStart.clone();
  while (d.isSameOrBefore(gridEnd)) {
    const iso = toISO(d);
    const inWindow = d.isSameOrAfter(start) && d.isSameOrBefore(end);
    const done = inWindow ? !!state.get(iso) : false;
    cells.push({ iso, day: d.clone(), inWindow, done });
    d.add(1, "day");
  }

  // Reverse to show latest date at top (oldest bottom)
  cells.reverse();

  // Render grid rows in reversed order
  for (const c of cells) {
    const cell = grid.createDiv({ cls: "weekly-streak-cell" });
    if (!c.inWindow) cell.classList.add("pad");
    if (c.done && c.inWindow) cell.classList.add("hit");
    cell.createDiv({ cls: "num", text: c.inWindow ? c.day.format("D") : "" });
    cell.createDiv({ cls: "ddd", text: c.inWindow ? c.day.format("ddd") : "" });
    cell.setAttr("title", c.inWindow ? `${c.day.format("ddd, DD MMM YYYY")} ${c.done ? "✅ Done" : "❌ Missed"}` : "");
  }

  // --- style ---
  const style = document.createElement("style");
  style.textContent = `
  .weekly-streak-wrap { margin-top:.5rem; }
  .weekly-streak-head {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width: 520px; margin-bottom:6px;
  }
  .weekly-streak-head .head {
    text-align:center; font-size:.75em; color: var(--text-faint);
  }
  .weekly-streak-grid {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width: 520px;
  }
  .weekly-streak-cell {
    aspect-ratio:1/1; border-radius:10px;
    background: var(--background-modifier-border);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }
  .weekly-streak-cell .num { font-weight:700; font-size:.9em; color: var(--text-muted); line-height:1; }
  .weekly-streak-cell .ddd { font-size:.7em; color: var(--text-faint); line-height:1; margin-top:2px; }
  .weekly-streak-cell.hit { background: var(--interactive-accent); }
  .weekly-streak-cell.hit .num, .weekly-streak-cell.hit .ddd { color:white; }
  .weekly-streak-cell.pad { opacity:.35; }
  `;
  wrap.appendChild(style);
}
~~~~



### Log

- [ ] 🔁Habit - subuh 2025-10-13 ^2025-10-13
- [x] 🔁Habit - subuh 2025-10-12 ^2025-10-12
- [x] 🔁Habit - subuh 2025-10-11 ^2025-10-11
- [ ] 🔁Habit - subuh 2025-10-09 ^2025-10-09
- [x] 📅Habit - Subuh 2025-10-08
- [x] 📅Habit - Subuh 2025-10-07
- [ ] 📅Habit - Subuh 2025-10-06




