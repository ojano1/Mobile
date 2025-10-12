

~~~dataviewjs
// === Habit Monthly Consistency (last 3 months, #bde3c0 zone) ===

const M = window.moment;
const toISO = d => M(d).format("YYYY-MM-DD");

// fallback data if no tasks
function generateFakeHabitData() {
  const today = M();
  const start = today.clone().subtract(89, "days");
  const out = [];
  let d = start.clone();
  while (d.isSameOrBefore(today)) {
    out.push({ date: toISO(d), done: Math.random() < 0.75 });
    d.add(1, "day");
  }
  return out;
}

function extractISO(s) {
  const m = String(s).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// collect
let tasks = dv.current().file.tasks ?? [];
tasks = tasks.map(t => ({ date: extractISO(t.text), done: !!t.completed })).filter(t => t.date);
if (!tasks.length) tasks = generateFakeHabitData();

// per-day map
const perDay = new Map();
for (const t of tasks) perDay.set(t.date, (perDay.get(t.date) || false) || t.done);

// group by month
const byMonth = {};
for (const [date, done] of perDay) {
  const k = M(date).format("YYYY-MM");
  (byMonth[k] ||= []).push({ date, done });
}

// last 3 months, latest first
const months = Object.keys(byMonth).sort().slice(-3).reverse();
const monthStats = months.map(m => {
  const arr = byMonth[m];
  const pct = arr.length ? Math.round((arr.filter(x => x.done).length / arr.length) * 100) : 0;
  return { label: M(m, "YYYY-MM").format("MMM"), pct };
});

// streak
let streak = 0;
{
  let d = M();
  for (let i = 0; i < 90; i++) {
    if (perDay.get(toISO(d))) streak++; else break;
    d.subtract(1, "day");
  }
}

// render
const wrap = dv.el("div", "", { cls: "habit-monthly-summary" });
wrap.createEl("p").innerHTML = `<strong>🔥 Current streak: ${streak} day${streak===1?"":"s"}</strong>`;

const barWrap = wrap.createDiv({ cls: "month-bars" });
monthStats.forEach(({ label, pct }, idx) => {
  const row = barWrap.createDiv({ cls: "month-row" });
  row.innerHTML = `
    <div class="month-label">${label}</div>
    <div class="bar-track">
      <div class="bar-fill ${idx === 0 ? 'bar-orange' : 'bar-purple'}" style="width:${pct}%;"></div>
    </div>
    <div class="pct-text">${pct}<span class="pct-symbol">%</span></div>
  `;
});

// style with rightmost 20% in #bde3c0
const style = document.createElement("style");
style.textContent = `
.habit-monthly-summary { margin:.75rem 0 1rem; }
.month-bars { display:flex; flex-direction:column; gap:10px; max-width:560px; }
.month-row { display:flex; align-items:center; gap:12px; width:100%; }
.month-label { width:3ch; text-align:right; font-weight:600; font-size:.95em; }


.bar-track {
  position:relative;
  flex:1;
  height:14px;
  border-radius:10px;
  overflow:hidden;
  background: color-mix(in srgb, var(--background-modifier-border) 35%, transparent);
}

.bar-fill {
  position:absolute; top:0; left:0; bottom:0;
  border-radius:10px;
  background: var(--interactive-accent);
}
.bar-fill.bar-orange { background:#f4b56a; }

.pct-text {
  display:flex; align-items:baseline; gap:1px;
  font-weight:600; font-size:1.05em; white-space:nowrap;
}
.pct-symbol { font-size:.8em; line-height:1; }
`;
wrap.appendChild(style);
~~~
##### 📅 30-Day Grid
~~~dataviewjs
// === Habit Grid (7 cols) — latest week on top, latest DONE = orange ===
// ANCHOR controls whether we anchor the window to "today" or the latest logged date.
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
  // one boolean per day (any done = done)
  const perDay = new Map();
  for (const t of tasks) perDay.set(t.date, (perDay.get(t.date) || false) || t.done);

  const datesSorted = [...perDay.keys()].sort();
  const latestLogged = M(datesSorted[datesSorted.length - 1]).startOf("day");
  const today        = M().startOf("day");
  const end          = (ANCHOR === "today") ? today : latestLogged;
  const start        = end.clone().subtract(29, "days");
  const gridStart    = start.clone().startOf("isoWeek");
  const gridEnd      = end.clone().endOf("isoWeek");

  // most recent DONE date (up to 'end')
  let latestDoneISO = null;
  for (let i = datesSorted.length - 1; i >= 0; i--) {
    const dISO = datesSorted[i];
    if (M(dISO).isAfter(end)) continue;
    if (perDay.get(dISO)) { latestDoneISO = dISO; break; }
  }

  // --- render ---
  const wrap = dv.el("div", "", { cls: "weekly-streak-wrap" });

  // header
  const head = wrap.createDiv({ cls: "weekly-streak-head" });
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(h => head.createDiv({ cls: "head", text: h }));

  // grid container
  const grid = wrap.createDiv({ cls: "weekly-streak-grid" });

  // collect weeks newest→oldest
  const weeks = [];
  let weekEnd = gridEnd.clone().endOf("isoWeek");
  while (weekEnd.isSameOrAfter(gridStart)) {
    const weekStart = weekEnd.clone().startOf("isoWeek");
    weeks.push({ weekStart: weekStart.clone(), weekEnd: weekEnd.clone() });
    weekEnd.subtract(1, "week");
  }

  // render each week
  for (const w of weeks) {
    let d = w.weekStart.clone();
    for (let i = 0; i < 7; i++) {
      const iso = toISO(d);
      const inWindow = d.isSameOrAfter(start) && d.isSameOrBefore(end);
      const done = inWindow ? !!perDay.get(iso) : false;

      const cell = grid.createDiv({ cls: "weekly-streak-cell" });
      if (!inWindow) cell.classList.add("pad");
      if (done && inWindow) {
        cell.classList.add("hit");
        if (iso === latestDoneISO) cell.classList.add("latest-hit");
      }

      cell.createDiv({ cls: "num", text: inWindow ? d.format("D") : "" });
      cell.createDiv({ cls: "mmm", text: inWindow ? d.format("MMM") : "" });
      cell.setAttr("title", inWindow ? `${d.format("ddd, DD MMM YYYY")} ${done ? "✅ Done" : "❌ Missed"}` : "");

      d.add(1, "day");
    }
  }

  // --- style ---
  const style = document.createElement("style");
  style.textContent = `
  .weekly-streak-wrap { margin-top:.25rem; }
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

  /* default DONE = theme accent (purple) */
  .weekly-streak-cell.hit {
    background: var(--interactive-accent);
  }
  .weekly-streak-cell.hit .num,
  .weekly-streak-cell.hit .mmm { color:white; }

  /* MOST RECENT DONE = orange override (same as slider) */
  .weekly-streak-cell.latest-hit {
    background: #f4b56a !important;
  }
  .weekly-streak-cell.latest-hit .num,
  .weekly-streak-cell.latest-hit .mmm { color:white; }

  .weekly-streak-cell.pad { opacity:.35; }
  `;
  wrap.appendChild(style);
}
~~~~

### ✍️Log
<%*
const today = tp.date.now("YYYY-MM-DD");
const M = window.moment;

// File info
const active = app.workspace?.getActiveFile?.();
const basename = active?.basename ?? tp.file.title ?? "";

// Core name from router if present, else from filename after " - "
const core = (typeof ROUTER_CORE !== "undefined")
  ? ROUTER_CORE
  : (basename.split(" - ").slice(1).join(" - ") || basename);

// ---- Weekday detection (EN + ID) ----
const dayAliases = {
  Monday:    ["monday","mon","senin","sen"],
  Tuesday:   ["tuesday","tue","tues","selasa","sel"],
  Wednesday: ["wednesday","wed","rabu","rab"],
  Thursday:  ["thursday","thu","thur","thurs","kamis","kam"],
  Friday:    ["friday","fri","jumat","jum'at","jum"],
  Saturday:  ["saturday","sat","sabtu","sab"],
  Sunday:    ["sunday","sun","minggu","ming","ahad","ahd"],
};
const aliasToKey = {};
for (const [k, arr] of Object.entries(dayAliases)) for (const a of arr) aliasToKey[a.toLowerCase()] = k;

const allAliases = Object.keys(aliasToKey).sort((a,b)=>b.length-a.length).join("|");
const aliasRe = new RegExp(`\\b(?:${allAliases})\\b`, "gi");

function extractWeekdays(str) {
  const hits = str.match(aliasRe);
  if (!hits) return [];
  return [...new Set(hits.map(s => aliasToKey[s.toLowerCase()]).filter(Boolean))];
}

const weekdays = extractWeekdays(basename);                       // weekly if any days present
const todayKey = aliasToKey[M().format("dddd").toLowerCase()] || M().format("dddd");

// ---- Add only when scheduled ----
const isWeekly = weekdays.length > 0;
const scheduledToday = !isWeekly || weekdays.includes(todayKey);

if (scheduledToday) {
  tR += `\n- [ ] 🔁Habit - ${core} ${today} ^${today}\n`;
} // else skip adding a line today
%>




