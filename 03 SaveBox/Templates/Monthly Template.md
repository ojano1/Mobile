> [!tip] 1️⃣Schedule your tasks into weeks.
>- Open the links to your **task notes** from the monthly list below, and give it a week tag like #W41
>- Tips: Swipe left to open the calendar and see the week number.
```dataviewjs
// Scope
const SCOPE = '"03 SaveBox/Active"';

// --- Host month from filename, e.g. "📅Oct 2025" or "📅October 2025"
function hostMonth() {
  const name = String(dv.current()?.file?.name ?? "");
  const m = /(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t|tember)?|oct(ober)?|nov(ember)?|dec(ember)?)/i.exec(name);
  if (!m) return null;
  return canonMonth(m[1]);
}

// --- Canonical month helpers
const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const MONTH_LABEL = {
  jan:"Jan", feb:"Feb", mar:"Mar", apr:"Apr", may:"May", jun:"Jun",
  jul:"Jul", aug:"Aug", sep:"Sep", oct:"Oct", nov:"Nov", dec:"Dec"
};
function canonMonth(s) {
  const x = String(s).toLowerCase();
  if (x.startsWith("jan")) return "Jan";
  if (x.startsWith("feb")) return "Feb";
  if (x.startsWith("mar")) return "Mar";
  if (x.startsWith("apr")) return "Apr";
  if (x === "may" || x.startsWith("may")) return "May";
  if (x.startsWith("jun")) return "Jun";
  if (x.startsWith("jul")) return "Jul";
  if (x.startsWith("aug")) return "Aug";
  if (x.startsWith("sep")) return "Sep";
  if (x.startsWith("oct")) return "Oct";
  if (x.startsWith("nov")) return "Nov";
  if (x.startsWith("dec")) return "Dec";
  return null;
}

// --- Tag helpers
function normTags(p) {
  return (p.file?.tags ?? []).map(t => String(t).trim().toLowerCase().replace(/^#/, ""));
}

// Project month from tags (#jan..#dec, case-insensitive, #sept -> #sep)
function projectMonthFromTags(p) {
  const t = normTags(p).map(x => x === "sept" ? "sep" : x);
  for (const key of MONTHS) if (t.includes(key)) return MONTH_LABEL[key];
  return null;
}

// Task week from tags (#W1..#W53 or #Week1..#Week53, case-insensitive)
function weekFromTags(p) {
  const tags = normTags(p);
  let n = null;
  for (const tag of tags) {
    let m = /^w(\d{1,2})$/i.exec(tag);
    if (!m) m = /^week(\d{1,2})$/i.exec(tag);
    if (m) {
      const v = Number(m[1]);
      if (v >= 1 && v <= 53) { n = v; break; }
    }
  }
  return n != null ? { label: `W${n}`, num: n } : { label: "Tag it", num: 99 };
}

const HM = hostMonth();
if (!HM) {
  dv.paragraph('No month found in this note title. Include a month like "📅Oct 2025" or "📅October 2025".');
} else {
  // Parents = Projects, filtered by month tag matching host month
  const projects = dv.pages(SCOPE)
    .where(p => p.file.name.toLowerCase().includes("project"))
    .where(p => projectMonthFromTags(p) === HM)
    .array();

  // Children = Tasks (all)
  const tasks = dv.pages(SCOPE)
    .where(c => c.file.name.toLowerCase().includes("task"))
    .array();

  const noData = (projects.length === 0) && (tasks.length === 0);
  if (noData) {
    dv.paragraph("Restart Obsidian to reload data.");
  } else {
    const rows = [];
    for (const proj of projects) {
      for (const task of tasks) {
        const linked =
          task.file.outlinks?.some(l => l.path === proj.file.path) ||
          task.file.inlinks?.some(l => l.path === proj.file.path) ||
          proj.file.outlinks?.some(l => l.path === task.file.path) ||
          proj.file.inlinks?.some(l => l.path === task.file.path);
        if (linked) {
          const wk = weekFromTags(task);

          // Format duration_hours with "hour"/"hours"
          const hRaw = task.duration_hours;
          const hNum = (hRaw === null || hRaw === undefined) ? NaN : Number(hRaw);
          const time = Number.isFinite(hNum)
            ? `${hNum} ${hNum === 1 ? "hour" : "hours"}`
            : "—";

          rows.push({ weekNum: wk.num, weekLabel: wk.label, task: task.file.link, time });
        }
      }
    }

    if (rows.length === 0) {
      dv.paragraph("Restart Obsidian to reload data.");
    } else {
      // Sort by week number, then by time (descending)
      rows.sort((a, b) =>
        (a.weekNum - b.weekNum) ||
        ((parseFloat(b.time) || 0) - (parseFloat(a.time) || 0))
      );

      dv.table(
        ["Week", "Task", "Time"],
        rows.map(r => [r.weekLabel, r.task, r.time])
      );
    }
  }
}

```
___
>[!tip] 2️⃣Open the weekly note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open weekly note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open weekly note*
> - Follow the steps there to assign the tasks' due date.
___

>[!tip] 3️⃣Come back next month for a review!😄
>- How did the month go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Monthly Review:
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
