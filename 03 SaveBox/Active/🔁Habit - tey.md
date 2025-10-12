
### 📅 30-Day Grid

~~~dataviewjs
// === Foldable Habit Grid (7 cols) + Streak + Completion % ===
// Latest week shown at the TOP, days inside a week stay Mon→Sun.

// keep this switch if you sometimes want to anchor to today
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
  // collapse multiple entries per day to a single boolean (any done = done)
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

  // --- streak (from end backwards, max 30 days) ---
  let streak = 0;
  {
    let d = end.clone();
    for (let i = 0; i < 30; i++) {
      const iso = toISO(d);
      if (state.get(iso)) streak++; else break;
      d.subtract(1, "day");
    }
  }

  // --- completion rate (same rules as your latest code) ---
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

  // grid, built as weeks (latest week first), days inside week Mon→Sun
  const grid = wrap.createDiv({ cls: "weekly-streak-grid" });

  // collect weeks from latest to oldest
  const weeks = [];
  let weekEnd = gridEnd.clone().endOf("isoWeek");
  while (weekEnd.isSameOrAfter(gridStart)) {
    const weekStart = weekEnd.clone().startOf("isoWeek");
    weeks.push({ weekStart: weekStart.clone(), weekEnd: weekEnd.clone() });
    weekEnd.subtract(1, "week"); // move to previous week
  }

  // render each week (already newest→oldest)
  for (const w of weeks) {
    let d = w.weekStart.clone();
    for (let i = 0; i < 7; i++) {
      const iso = toISO(d);
      const inWindow = d.isSameOrAfter(start) && d.isSameOrBefore(end);
      const done = inWindow ? !!state.get(iso) : false;

      const cell = grid.createDiv({ cls: "weekly-streak-cell" });
      if (!inWindow) cell.classList.add("pad");
      if (done && inWindow) cell.classList.add("hit");

      cell.createDiv({ cls: "num", text: inWindow ? d.format("D") : "" });
      cell.createDiv({ cls: "mmm", text: inWindow ? d.format("MMM") : "" });
      cell.setAttr("title", inWindow ? `${d.format("ddd, DD MMM YYYY")} ${done ? "✅ Done" : "❌ Missed"}` : "");

      d.add(1, "day");
    }
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
~~~
### Percentage
~~~dataviewjs
// === Habit Monthly Consistency (last 3 months, latest on top, inline %) ===
// Shows completion rate per month + visual bars

const M = window.moment;
const toISO = d => M(d).format("YYYY-MM-DD");

// --- mock generator for testing ---
function generateFakeHabitData() {
  const today = M();
  const start = today.clone().subtract(89, "days");
  const out = [];
  let d = start.clone();
  while (d.isSameOrBefore(today)) {
    const done = Math.random() < 0.75;
    out.push({ date: toISO(d), done });
    d.add(1, "day");
  }
  return out;
}

// --- extract date from task text ---
function extractISO(s) {
  s = String(s).trim();
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// --- collect real tasks or generate sample ---
let tasks = dv.current().file.tasks ?? [];
tasks = tasks
  .map(t => ({ date: extractISO(t.text), done: !!t.completed }))
  .filter(t => t.date);

if (!tasks.length) tasks = generateFakeHabitData();

// --- collapse multiple entries per day ---
const perDay = new Map();
for (const t of tasks) perDay.set(t.date, (perDay.get(t.date) || false) || t.done);

// --- group by month ---
const byMonth = {};
for (const [date, done] of perDay) {
  const mKey = M(date).format("YYYY-MM");
  if (!byMonth[mKey]) byMonth[mKey] = [];
  byMonth[mKey].push({ date, done });
}

// --- find current and last 2 months (LATEST ON TOP) ---
const months = Object.keys(byMonth).sort().slice(-3).reverse();

const monthStats = months.map(mKey => {
  const arr = byMonth[mKey];
  const days = arr.length;
  const doneDays = arr.filter(x => x.done).length;
  const pct = days ? Math.round((doneDays / days) * 100) : 0;
  return {
    key: mKey,
    label: M(mKey, "YYYY-MM").format("MMM"),
    pct,
    days,
    doneDays
  };
});

// --- streak ---
let streak = 0;
{
  let d = M();
  for (let i = 0; i < 90; i++) {
    const iso = toISO(d);
    if (perDay.get(iso)) streak++; else break;
    d.subtract(1, "day");
  }
}

// --- render ---
const wrap = dv.el("div", "", { cls: "habit-monthly-summary" });
wrap.createEl("p").innerHTML = `<strong>🔥 Current streak: ${streak} day${streak===1?"":"s"}</strong>`;

const barWrap = wrap.createDiv({ cls: "month-bars" });
for (const { label, pct } of monthStats) {
  const bar = barWrap.createDiv({ cls: "month-bar" });
  bar.createDiv({ cls: "month-label", text: label });
  
  // progress container
  const progress = bar.createDiv({ cls: "progress" });
  const barFill = progress.createDiv({ cls: "bar-fill" });
  barFill.style.width = `${pct}%`;
  barFill.setAttribute("title", `${pct}%`);

  // percentage inline
  const pctText = progress.createDiv({ cls: "pct-inline", text: `${pct}%` });
}

// --- style ---
const style = document.createElement("style");
style.textContent = `
.habit-monthly-summary { margin: .75rem 0 1rem; }
.month-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}
.month-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-label {
  width: 3ch;
  text-align: right;
  font-weight: 600;
  font-size: .9em;
}
.progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar-fill {
  flex: 1;
  height: 10px;
  background: var(--background-modifier-border);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.bar-fill::after {
  content: "";
  display: block;
  height: 100%;
  width: inherit;
  background: var(--interactive-accent);
  border-radius: 6px;
}
.pct-inline {
  font-weight: 600;
  font-size: .85em;
  width: 3ch;
  text-align: left;
}
`;
wrap.appendChild(style);
~~~~

### Merged
~~~dataviewjs
// === Habit Monthly Consistency (last 3 months, latest on top) ===
// Shows completion rate per month + visual bars

const M = window.moment;
const toISO = d => M(d).format("YYYY-MM-DD");

// --- mock generator for testing ---
function generateFakeHabitData() {
  const today = M();
  const start = today.clone().subtract(89, "days");
  const out = [];
  let d = start.clone();
  while (d.isSameOrBefore(today)) {
    const done = Math.random() < 0.75; // ~75%
    out.push({ date: toISO(d), done });
    d.add(1, "day");
  }
  return out;
}

// --- extract date from task text ---
function extractISO(s) {
  s = String(s).trim();
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// --- collect real tasks or generate sample ---
let tasks = dv.current().file.tasks ?? [];
tasks = tasks
  .map(t => ({ date: extractISO(t.text), done: !!t.completed }))
  .filter(t => t.date);

if (!tasks.length) tasks = generateFakeHabitData();

// --- collapse multiple entries per day ---
const perDay = new Map();
for (const t of tasks) perDay.set(t.date, (perDay.get(t.date) || false) || t.done);

// --- group by month ---
const byMonth = {};
for (const [date, done] of perDay) {
  const mKey = M(date).format("YYYY-MM");
  if (!byMonth[mKey]) byMonth[mKey] = [];
  byMonth[mKey].push({ date, done });
}

// --- find current and last 2 months (LATEST ON TOP) ---
const months = Object.keys(byMonth).sort().slice(-3).reverse();

const monthStats = months.map(mKey => {
  const arr = byMonth[mKey];
  const days = arr.length;
  const doneDays = arr.filter(x => x.done).length;
  const pct = days ? Math.round((doneDays / days) * 100) : 0;
  return {
    key: mKey,
    label: M(mKey, "YYYY-MM").format("MMM"),
    pct,
    days,
    doneDays
  };
});

// --- streak (simple, from today backwards) ---
let streak = 0;
{
  let d = M();
  for (let i = 0; i < 90; i++) {
    const iso = toISO(d);
    if (perDay.get(iso)) streak++; else break;
    d.subtract(1, "day");
  }
}

// --- render ---
const wrap = dv.el("div", "", { cls: "habit-monthly-summary" });
wrap.createEl("p").innerHTML = `<strong>🔥 Current streak: ${streak} day${streak===1?"":"s"}</strong>`;

const barWrap = wrap.createDiv({ cls: "month-bars" });
for (const { label, pct } of monthStats) {
  const bar = barWrap.createDiv({ cls: "month-bar" });
  bar.createDiv({ cls: "month-label", text: label });
  const barFill = bar.createDiv({ cls: "bar-fill" });
  barFill.style.width = `${pct}%`;
  barFill.setAttribute("title", `${pct}%`); // keep as in your working code
  bar.createDiv({ cls: "pct-text", text: `${pct}%` });
}

// --- style (unchanged) ---
const style = document.createElement("style");
style.textContent = `
.habit-monthly-summary { margin: .75rem 0 1rem; }
.month-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}
.month-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-label {
  width: 3ch;
  text-align: right;
  font-weight: 600;
  font-size: .9em;
}
.bar-fill {
  flex: 1;
  height: 10px;
  background: var(--background-modifier-border);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.bar-fill::after {
  content: "";
  display: block;
  height: 100%;
  width: inherit;
  background: var(--interactive-accent);
  border-radius: 6px;
}
.pct-text {
  width: 3ch;
  text-align: left;
  font-weight: 500;
  font-size: .85em;
}
`;
wrap.appendChild(style);
~~~
### ✍️Log

- [x] 🔁Habit - Pushup 2025-10-12 ^2025-10-12
- [x] 🔁Habit - Pushup 2025-10-11 ^2025-10-11
- [x] 🔁Habit - Pushup 2025-10-10 ^2025-10-10
- [x] 🔁Habit - Pushup 2025-10-09 ^2025-10-09
- [x] 🔁Habit - Pushup 2025-10-08 ^2025-10-08
- [x] 🔁Habit - Pushup 2025-10-07 ^2025-10-07
- [ ] 🔁Habit - Pushup 2025-10-06 ^2025-10-06
- [x] 🔁Habit - Pushup 2025-10-05 ^2025-10-05
- [x] 🔁Habit - Pushup 2025-10-04 ^2025-10-04
- [ ] 🔁Habit - Pushup 2025-10-03 ^2025-10-03
- [x] 🔁Habit - Pushup 2025-10-02 ^2025-10-02
- [x] 🔁Habit - Pushup 2025-10-01 ^2025-10-01
- [x] 🔁Habit - Pushup 2025-09-30 ^2025-09-30
- [ ] 🔁Habit - Pushup 2025-09-29 ^2025-09-29
- [x] 🔁Habit - Pushup 2025-09-28 ^2025-09-28
- [x] 🔁Habit - Pushup 2025-09-27 ^2025-09-27
- [x] 🔁Habit - Pushup 2025-09-26 ^2025-09-26
- [ ] 🔁Habit - Pushup 2025-09-25 ^2025-09-25
- [x] 🔁Habit - Pushup 2025-09-24 ^2025-09-24
- [x] 🔁Habit - Pushup 2025-09-23 ^2025-09-23
- [ ] 🔁Habit - Pushup 2025-09-22 ^2025-09-22
- [x] 🔁Habit - Pushup 2025-09-21 ^2025-09-21
- [x] 🔁Habit - Pushup 2025-09-20 ^2025-09-20
- [x] 🔁Habit - Pushup 2025-09-19 ^2025-09-19
- [ ] 🔁Habit - Pushup 2025-09-18 ^2025-09-18
- [x] 🔁Habit - Pushup 2025-09-17 ^2025-09-17
- [x] 🔁Habit - Pushup 2025-09-16 ^2025-09-16
- [ ] 🔁Habit - Pushup 2025-09-15 ^2025-09-15
- [x] 🔁Habit - Pushup 2025-09-14 ^2025-09-14
- [x] 🔁Habit - Pushup 2025-09-13 ^2025-09-13
- [x] 🔁Habit - Pushup 2025-09-12 ^2025-09-12
- [ ] 🔁Habit - Pushup 2025-09-11 ^2025-09-11
- [x] 🔁Habit - Pushup 2025-09-10 ^2025-09-10
- [x] 🔁Habit - Pushup 2025-09-09 ^2025-09-09
- [ ] 🔁Habit - Pushup 2025-09-08 ^2025-09-08
- [x] 🔁Habit - Pushup 2025-09-07 ^2025-09-07
- [x] 🔁Habit - Pushup 2025-09-06 ^2025-09-06
- [x] 🔁Habit - Pushup 2025-09-05 ^2025-09-05
- [ ] 🔁Habit - Pushup 2025-09-04 ^2025-09-04
- [x] 🔁Habit - Pushup 2025-09-03 ^2025-09-03
- [x] 🔁Habit - Pushup 2025-09-02 ^2025-09-02
- [ ] 🔁Habit - Pushup 2025-09-01 ^2025-09-01
- [x] 🔁Habit - Pushup 2025-08-31 ^2025-08-31
- [x] 🔁Habit - Pushup 2025-08-30 ^2025-08-30
- [x] 🔁Habit - Pushup 2025-08-29 ^2025-08-29
- [ ] 🔁Habit - Pushup 2025-08-28 ^2025-08-28
- [x] 🔁Habit - Pushup 2025-08-27 ^2025-08-27
- [x] 🔁Habit - Pushup 2025-08-26 ^2025-08-26
- [ ] 🔁Habit - Pushup 2025-08-25 ^2025-08-25
- [x] 🔁Habit - Pushup 2025-08-24 ^2025-08-24
- [x] 🔁Habit - Pushup 2025-08-23 ^2025-08-23
- [x] 🔁Habit - Pushup 2025-08-22 ^2025-08-22
- [ ] 🔁Habit - Pushup 2025-08-21 ^2025-08-21
- [x] 🔁Habit - Pushup 2025-08-20 ^2025-08-20
- [x] 🔁Habit - Pushup 2025-08-19 ^2025-08-19
- [ ] 🔁Habit - Pushup 2025-08-18 ^2025-08-18
- [x] 🔁Habit - Pushup 2025-08-17 ^2025-08-17
- [x] 🔁Habit - Pushup 2025-08-16 ^2025-08-16
- [x] 🔁Habit - Pushup 2025-08-15 ^2025-08-15
- [ ] 🔁Habit - Pushup 2025-08-14 ^2025-08-14
- [x] 🔁Habit - Pushup 2025-08-13 ^2025-08-13
- [x] 🔁Habit - Pushup 2025-08-12 ^2025-08-12
- [x] 🔁Habit - Pushup 2025-08-11 ^2025-08-11
- [x] 🔁Habit - Pushup 2025-08-10 ^2025-08-10
- [ ] 🔁Habit - Pushup 2025-08-09 ^2025-08-09
- [x] 🔁Habit - Pushup 2025-08-08 ^2025-08-08
- [x] 🔁Habit - Pushup 2025-08-07 ^2025-08-07
- [x] 🔁Habit - Pushup 2025-08-06 ^2025-08-06
- [ ] 🔁Habit - Pushup 2025-08-05 ^2025-08-05
- [x] 🔁Habit - Pushup 2025-08-04 ^2025-08-04
- [x] 🔁Habit - Pushup 2025-08-03 ^2025-08-03
- [ ] 🔁Habit - Pushup 2025-08-02 ^2025-08-02
- [x] 🔁Habit - Pushup 2025-08-01 ^2025-08-01
- [x] 🔁Habit - Pushup 2025-07-31 ^2025-07-31
- [x] 🔁Habit - Pushup 2025-07-30 ^2025-07-30
- [x] 🔁Habit - Pushup 2025-07-29 ^2025-07-29
- [ ] 🔁Habit - Pushup 2025-07-28 ^2025-07-28
- [x] 🔁Habit - Pushup 2025-07-27 ^2025-07-27
- [x] 🔁Habit - Pushup 2025-07-26 ^2025-07-26
- [ ] 🔁Habit - Pushup 2025-07-25 ^2025-07-25
- [x] 🔁Habit - Pushup 2025-07-24 ^2025-07-24
- [x] 🔁Habit - Pushup 2025-07-23 ^2025-07-23
- [x] 🔁Habit - Pushup 2025-07-22 ^2025-07-22
- [ ] 🔁Habit - Pushup 2025-07-21 ^2025-07-21
- [x] 🔁Habit - Pushup 2025-07-20 ^2025-07-20
- [x] 🔁Habit - Pushup 2025-07-19 ^2025-07-19
- [ ] 🔁Habit - Pushup 2025-07-18 ^2025-07-18
- [x] 🔁Habit - Pushup 2025-07-17 ^2025-07-17
- [x] 🔁Habit - Pushup 2025-07-16 ^2025-07-16
- [x] 🔁Habit - Pushup 2025-07-15 ^2025-07-15
- [ ] 🔁Habit - Pushup 2025-07-14 ^2025-07-14
- [x] 🔁Habit - Pushup 2025-07-13 ^2025-07-13
- [x] 🔁Habit - Pushup 2025-07-12 ^2025-07-12
- [ ] 🔁Habit - Pushup 2025-07-11 ^2025-07-11
- [x] 🔁Habit - Pushup 2025-07-10 ^2025-07-10
- [x] 🔁Habit - Pushup 2025-07-09 ^2025-07-09
- [x] 🔁Habit - Pushup 2025-07-08 ^2025-07-08
- [x] 🔁Habit - Pushup 2025-07-07 ^2025-07-07
- [ ] 🔁Habit - Pushup 2025-07-06 ^2025-07-06
- [x] 🔁Habit - Pushup 2025-07-05 ^2025-07-05
- [x] 🔁Habit - Pushup 2025-07-04 ^2025-07-04
- [x] 🔁Habit - Pushup 2025-07-03 ^2025-07-03






