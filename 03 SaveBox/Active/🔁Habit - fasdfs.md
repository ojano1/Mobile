
### 📅 30-Day Grid
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
  const perDay = new Map();
  for (const t of tasks) perDay.set(t.date, (perDay.get(t.date) || false) || t.done);

  const state = perDay;

  const datesSorted = [...state.keys()].sort();
  const latest = M(datesSorted[datesSorted.length - 1]).startOf("day");
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
  const loggedDates = datesSorted;
  const loggedCount = loggedDates.length;
  let completionRate = 0;

  if (loggedCount > 0 && loggedCount < 30) {
    const doneLogged = loggedDates.filter(d => state.get(d)).length;
    completionRate = Math.round((doneLogged / loggedCount) * 100);
  } else if (loggedCount >= 30) {
    const last30 = loggedDates.slice(-30);
    const done30 = last30.filter(d => state.get(d)).length;
    completionRate = Math.round((done30 / 30) * 100);
  }

  // --- render ---
  const wrap = dv.el("div", "", { cls: "weekly-streak-wrap" });

  wrap.createEl("p", { text: "", cls: "streak-line" })
    .innerHTML = `<strong>🔥 Current streak: ${streak} day${streak===1?"":"s"} • 📊 ${completionRate}% complete</strong>`;

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

    // Day + Month label only
    cell.createDiv({ cls: "num", text: inWindow ? d.format("D") : "" });
    cell.createDiv({ cls: "mmm", text: inWindow ? d.format("MMM") : "" });
    cell.setAttr("title",
      inWindow ? `${d.format("ddd, DD MMM YYYY")} ${done ? "✅ Done" : "❌ Missed"}` : ""
    );

    d.add(1, "day");
  }

  // --- style ---
  const style = document.createElement("style");
  style.textContent = `
  .weekly-streak-wrap { margin-top:.5rem; }
  .streak-line strong { font-weight:700; }
  .weekly-streak-head {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width:520px; margin-bottom:6px;
  }
  .weekly-streak-head .head {
    text-align:center; font-size:.75em; color: var(--text-faint);
  }
  .weekly-streak-grid {
    display:grid; grid-template-columns: repeat(7, 1fr);
    gap:6px; max-width:520px;
  }
  .weekly-streak-cell {
    aspect-ratio:1/1; border-radius:10px;
    background: var(--background-modifier-border);
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding-top:4px;
  }
  .weekly-streak-cell .num {
    font-weight:700; font-size:.95em; color: var(--text-muted); line-height:1.1;
  }
  .weekly-streak-cell .mmm {
    font-size:.7em; color: var(--text-faint); line-height:1.1; margin-top:2px;
  }
  .weekly-streak-cell.hit {
    background: var(--interactive-accent);
  }
  .weekly-streak-cell.hit .num,
  .weekly-streak-cell.hit .mmm {
    color:white;
  }
  .weekly-streak-cell.pad { opacity:.35; }
  `;
  wrap.appendChild(style);
}
```
### ✍️Log

- [x] 🔁Habit - fasdfs 2025-10-11 ^2025-10-11





