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
[[🧠Mind Map]]

>[!tip] 2️⃣Open the daily note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open daily note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open daily note*

⏳⌛️

>[!tip] 3️⃣Come back next week for a review!😄
>- How did the week go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Weekly Review:
'
'
'
'

___

### 🔗Backlinks:
~~~dataviewjs
const backlinks = dv.pages()
  .where(p =>
    p.file.outlinks &&
    p.file.outlinks.some(link => link.path === dv.current().file.path) &&
    !/template/i.test(p.file.folder) &&
    !/archive/i.test(p.file.folder)
  )
  .sort(p => p.file.name, 'asc');

if (backlinks.length) {
  dv.list(backlinks.map(p => p.file.link));
} else {
  dv.paragraph("None");
}
~~~


