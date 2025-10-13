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
See the [[🧠Mind Map]] for a bird’s-eye view of your life.


>[!tip] 2️⃣Open the monthly note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open monthly note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open monthly note*
> - Follow the steps there to assign the weekly tag.

⏳⌛️

>[!tip] 3️⃣Come back next quarter for a review!😄
>- How did the quarter go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Quarterly Review:
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