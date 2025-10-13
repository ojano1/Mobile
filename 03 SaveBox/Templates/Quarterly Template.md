> [!tip] 1️⃣Schedule your projects into months.
>- Open the links to your **project notes** from the quarter list below, and give it a month tag like #Oct 
>- Tips: Start the project with the most hours early.

~~~dataviewjs
// Scope: both Goals and Projects live here
const SCOPE = '"03 SaveBox/Active"';

// --- Host quarter from current file name, e.g. "... Q1 ..."
function hostQuarter() {
  const name = String(dv.current()?.file?.name ?? "");
  const m = /q([1-4])/i.exec(name);
  return m ? `Q${m[1]}` : null;
}

// --- Tag helpers
function normTags(p) {
  return (p.file?.tags ?? []).map(t => String(t).trim().toLowerCase().replace(/^#/, ""));
}

// Child quarter from tags (#Q1-#Q4)
function quarterFromTags(p) {
  const t = normTags(p);
  if (t.includes("q1")) return "Q1";
  if (t.includes("q2")) return "Q2";
  if (t.includes("q3")) return "Q3";
  if (t.includes("q4")) return "Q4";
  return null;
}

// Child month from tags (#jan ... #dec). Accepts #sept -> #sep
const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const MONTH_LABEL = {jan:"Jan", feb:"Feb", mar:"Mar", apr:"Apr", may:"May", jun:"Jun",
                     jul:"Jul", aug:"Aug", sep:"Sep", oct:"Oct", nov:"Nov", dec:"Dec"};
function monthFromTags(p) {
  const t = normTags(p).map(x => x === "sept" ? "sep" : x);
  for (const m of MONTHS) if (t.includes(m)) return MONTH_LABEL[m];
  return "Tag it";
}

const HQ = hostQuarter();
if (!HQ) {
  dv.paragraph('No quarter found in this note title. Add "Q1", "Q2", "Q3", or "Q4" to the filename.');
} else {
  // Parent = Goal (no quarter filter)
  const parents = dv.pages(SCOPE)
    .where(p => p.file.name.toLowerCase().includes("goal"))
    .array();

  // Child = Project, must match host quarter
  const children = dv.pages(SCOPE)
    .where(c => c.file.name.toLowerCase().includes("project"))
    .where(c => quarterFromTags(c) === HQ)
    .array();

  const noData = (parents.length === 0) && (children.length === 0);
  if (noData) {
    dv.paragraph("Restart Obsidian to reload data.");
  } else {
    const rows = [];
    for (const child of children) {
      const month = monthFromTags(child);
      const hours = child.duration_hours ?? null;

      for (const parent of parents) {
        const linked =
          child.file.outlinks?.some(l => l.path === parent.file.path) ||
          child.file.inlinks?.some(l => l.path === parent.file.path) ||
          parent.file.outlinks?.some(l => l.path === child.file.path) ||
          parent.file.inlinks?.some(l => l.path === child.file.path);
        if (linked) rows.push({ month, project: child.file.link, hours });
      }
    }

    if (rows.length === 0) {
      dv.paragraph("Restart Obsidian to reload data.");
    } else {
      // Sort: Tag it first, then Jan–Dec, then by duration_hours (descending)
      const monthOrder = {
        "Tag it": 0, Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6,
        Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12
      };
      rows.sort((a, b) => {
        const monthDiff = (monthOrder[a.month] ?? 99) - (monthOrder[b.month] ?? 99);
        if (monthDiff !== 0) return monthDiff;

        // Sort by duration_hours descending (nulls last)
        const ha = a.hours ?? -1;
        const hb = b.hours ?? -1;
        return hb - ha;
      });

      // Render
      dv.table(["Month", "Project", "Hours"], rows.map(r => [
        r.month,
        r.project,
        r.hours ?? "—"
      ]));
    }
  }
}
~~~
___
>[!tip] 2️⃣Open the monthly note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open monthly note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open monthly note*
> - Follow the steps there to assign the weekly tag.

___

>[!tip] 3️⃣Come back next quarter for a review!😄
>- How did the quarter go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Quarterly Review:
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