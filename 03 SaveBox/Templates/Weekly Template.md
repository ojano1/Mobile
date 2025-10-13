> [!tip] 1️⃣Put due dates to your tasks
>- Open the links to your **task notes** from the weekly list below, and give it a due date.

~~~dataviewjs
// Scope
const SCOPE = '"03 SaveBox/Active"';

// -------- Host YEAR + WEEK from filename, e.g. "2025-W41", "Week 41 2025" --------
function hostYearWeek() {
  const name = String(dv.current()?.file?.name ?? "");
  // Try <year> ... W##  OR W## ... <year>
  let m = /(\d{4}).*?(?:week|w)\s*?(\d{1,2})/i.exec(name);
  if (m) return { year: Number(m[1]), week: Number(m[2]) };
  m = /(?:week|w)\s*?(\d{1,2}).*?(\d{4})/i.exec(name);
  if (m) return { year: Number(m[2]), week: Number(m[1]) };
  // Fallback, week only
  const w = /(week|w)\s*?(\d{1,2})/i.exec(name);
  return { year: null, week: w ? Number(w[2]) : null };
}

// -------- Tag helpers --------
function normTags(p) {
  return (p.file?.tags ?? []).map(t => String(t).trim().toLowerCase().replace(/^#/, ""));
}

// Extract week number from tags (#W1..#W53 or #Week1..#Week53)
function weekFromTags(p) {
  for (const t of normTags(p)) {
    let m = /^w(\d{1,2})$/.exec(t);
    if (m) return Number(m[1]);
    m = /^week(\d{1,2})$/.exec(t);
    if (m) return Number(m[1]);
  }
  return null;
}

// Parse child's due to get weekday name
function parseDue(p) {
  for (const k of ["due", "dueDate", "duedate", "deadline", "scheduled"]) {
    if (p[k]) {
      const d = dv.date(p[k]);
      if (d) return d; // Luxon DateTime
    }
  }
  return null;
}

// Map weekday short name -> Luxon ISO weekday (Mon=1..Sun=7)
const DAY_NUM = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

// Deduce actual date from host (year, week) and weekday name ("Mon".."Sun")
function deducedDate(weekYear, weekNumber, dayName) {
  if (!weekNumber || !dayName) return null;
  const dn = DAY_NUM[String(dayName).toLowerCase()];
  if (!dn) return null;
  if (!weekYear) return null; // Need a year to resolve ISO week date
  const d = dv.luxon.DateTime.fromObject({ weekYear, weekNumber, weekday: dn });
  return d.isValid ? d : null;
}

// -------- Data --------
const HW = hostYearWeek();
if (!HW.week) {
  dv.paragraph('No week found in this note title. Include "2025-W41" or "Week 41 2025".');
} else {
  const pages = dv.pages(SCOPE).array();

  // Parent = Project
  const parents = pages.filter(p => p.file.name.toLowerCase().includes("project"));

  // Child = Task, must match host week tag
  const children = pages.filter(c => {
    if (!c.file.name.toLowerCase().includes("task")) return false;
    return weekFromTags(c) === HW.week;
  });

  if (parents.length === 0 && children.length === 0) {
    dv.paragraph("Restart Obsidian to reload data");
  } else {
    const rows = [];
    for (const child of children) {
      const due = parseDue(child);
      const dayName = due ? due.toFormat("ccc") : null;

      // Deduce date text from host year/week + weekday
      const d = deducedDate(HW.year, HW.week, dayName);
      const dateText = d ? d.toFormat("ccc, d LLL ''yy") : "Put a date";

      // Format duration_hours with "hour"/"hours"
      const hRaw = child.duration_hours;
      const hNum = (hRaw === null || hRaw === undefined) ? NaN : Number(hRaw);
      const hours =
        Number.isFinite(hNum)
          ? `${hNum} ${hNum === 1 ? "hour" : "hours"}`
          : "—";

      for (const parent of parents) {
        const linked =
          child.file.outlinks?.some(l => l.path === parent.file.path) ||
          child.file.inlinks?.some(l => l.path === parent.file.path) ||
          parent.file.outlinks?.some(l => l.path === child.file.path) ||
          parent.file.inlinks?.some(l => l.path === child.file.path);
        if (linked) rows.push([dateText, child.file.link, hours]);
      }
    }

    if (rows.length === 0) {
      dv.paragraph("Restart Obsidian to reload data");
    } else {
      // Sort by date text, then by hours (descending)
      rows.sort((a, b) =>
        String(a[0]).localeCompare(String(b[0])) ||
        ((parseFloat(b[2]) || 0) - (parseFloat(a[2]) || 0))
      );

      dv.table(["Due Date", "Task", "Time"], rows);
    }
  }
}

~~~
___
>[!tip] 2️⃣Open the daily note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open daily note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open daily note*

___

>[!tip] 3️⃣Come back next week for a review!😄
>- How did the week go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Weekly Review:
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

