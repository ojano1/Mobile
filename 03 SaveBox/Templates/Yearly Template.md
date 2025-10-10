
>[!quote] Indeed, Allah does not change the condition of a people until they change what is in themselves.
>
>— _Surah Ar-Ra’d (13:11)_

___

>[!question] 1️⃣ Which goal do you want to complete this year?
>- Open the link to your **goal notes** and type a year tag. E.g. #Y2025 
~~~dataviewjs
// Scope
const SCOPE = '"03 SaveBox/Active"';

// Host year from current note title or filename, e.g. "Year 2025" or "... Y2025 ..."
function hostYear() {
  const name = String(dv.current()?.file?.name ?? "");
  // Match "Y2025" in the filename
  let m = /(?:^|[\s_\-\.])y(\d{4})(?=$|[\s_\-\.])/i.exec(name);
  if (m) return Number(m[1]);
  // Match "Year 2025"
  m = /year\D*(\d{4})/i.exec(name);
  if (m) return Number(m[1]);
  // Fallback to tag on the host note
  const y = yearFromTag(dv.current());
  return y ?? null;
}

// Normalize tags
function normTags(p) {
  return (p?.file?.tags ?? []).map(t => String(t).trim().toLowerCase().replace(/^#/, ""));
}

// Year from tag like #Y2025 -> 2025
function yearFromTag(p) {
  for (const t of normTags(p)) {
    const m = /^y(\d{4})$/.exec(t);
    if (m) return Number(m[1]);
  }
  return null;
}

// Label for Tag Year
function tagYearLabel(p) {
  const y = yearFromTag(p);
  return y ? `Y${y}` : "Tag it";
}

// Link helpers
function linksTo(a, b) {
  return !!(
    a?.file?.outlinks?.some(l => l.path === b?.file?.path) ||
    a?.file?.inlinks?.some(l => l.path === b?.file?.path)
  );
}
function bidiLinked(a, b) { return linksTo(a, b) && linksTo(b, a); }

const HY = hostYear();
if (HY == null) {
  dv.paragraph('No year found. Expected filename contains "Y2025" or title like "Year 2025".');
} else {
  const pages = dv.pages(SCOPE).array();

  // goals = contain "goal", match year or no tag, exclude filename ending with "!"
  const goals = pages
    .filter(p => p.file.name.toLowerCase().includes("goal"))
    .filter(p => !p.file.name.trim().endsWith("!"))
    .filter(p => yearFromTag(p) === HY || yearFromTag(p) == null);

  // projects = contain "project"
  const projects = pages.filter(p => p.file.name.toLowerCase().includes("project"));

  if (goals.length === 0) {
    dv.paragraph("No goals for this year in scope.");
  } else {
    const rows = [];

    for (const g of goals) {
      const linkedProjects = projects.filter(pr =>
        pr.file.path !== g.file.path && bidiLinked(pr, g)
      );

      if (linkedProjects.length === 0) {
        rows.push([tagYearLabel(g), g.file.link, "—"]);
      } else {
        for (const pr of linkedProjects) {
          const priority = pr.priority ?? "—";
          rows.push([tagYearLabel(g), g.file.link, priority]);
        }
      }
    }

    rows.sort((a, b) =>
      String(a[0]).localeCompare(String(b[0])) ||
      String(a[1]).localeCompare(String(b[1]))
    );

    dv.table(["Year", "Goal", "Priority"], rows);
  }
}
~~~
[[🧠Mind Map]]

>[!tip] 2️⃣Schedule your projects into Q1-Q4
>- Open the link to your **goal notes** and type a  quarter tag. E.g. #Q1 

~~~dataviewjs
// Scope
const SCOPE = '"03 SaveBox/Active"';

// Extract year from current note filename/title, e.g. "...Y2025..." or "📅Year 2025"
function hostYear() {
  const name = String(dv.current()?.file?.name ?? "");
  // Match "Y2025" in the filename
  let m = /(?:^|[\s_\-\.])y(\d{4})(?=$|[\s_\-\.])/i.exec(name);
  if (m) return Number(m[1]);
  // Match "Year 2025"
  m = /year\D*(\d{4})/i.exec(name);
  if (m) return Number(m[1]);
  // Fallback to tag on the host note
  const y = yearFromTag(dv.current());
  return y ?? null;
}

// Normalize tags
function normTags(p) {
  return (p?.file?.tags ?? []).map(t => String(t).trim().toLowerCase().replace(/^#/, ""));
}

// Quarter tag from project, fallback to "Not Started"
function getQuarterTag(p) {
  const t = normTags(p);
  if (t.includes("q1")) return "Q1";
  if (t.includes("q2")) return "Q2";
  if (t.includes("q3")) return "Q3";
  if (t.includes("q4")) return "Q4";
  return "Tag it";
}

// Year from tag like #Y2025
function yearFromTag(p) {
  for (const t of normTags(p)) {
    const m = /^y(\d{4})$/.exec(t);
    if (m) return Number(m[1]);
  }
  return null;
}

const HY = hostYear();

if (HY == null) {
  dv.paragraph('No year found. Expected filename contains "Y2025", title like "Year 2025", or a #Y2025 tag.');
} else {
  // Get all projects and goals
  const projects = dv.pages(SCOPE)
    .where(p => p.file.name.toLowerCase().includes("project"))
    .array();

  const goals = dv.pages(SCOPE)
    .where(g => g.file.name.toLowerCase().includes("goal"))
    .where(g => yearFromTag(g) === HY)
    .array();

  const noData = (projects.length === 0) && (goals.length === 0);
  if (noData) {
    dv.paragraph("Restart Obsidian to reload data.");
  } else {
    const rows = [];

    for (const p of projects) {
      const q = getQuarterTag(p);
      const prio = p.priority ?? "—";

      for (const g of goals) {
        const linked =
          g.file.outlinks?.some(l => l.path === p.file.path) ||
          g.file.inlinks?.some(l => l.path === p.file.path) ||
          p.file.outlinks?.some(l => l.path === g.file.path) ||
          p.file.inlinks?.some(l => l.path === g.file.path);

        if (linked) rows.push({ q, project: p.file.link, goal: g.file.link, prio });
      }
    }

    if (rows.length === 0) {
      dv.paragraph("Restart Obsidian to reload data.");
    } else {
      // Sort with Not Started first, then Q1–Q4
      const order = { "Tag it": 0, "Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4 };
      rows.sort((a, b) =>
        (order[a.q] ?? 99) - (order[b.q] ?? 99) ||
        String(a.project).localeCompare(String(b.project))
      );

      dv.table(["Quarter", "Project", "Priority"], rows.map(r => [r.q, r.project, r.prio]));
    }
  }
}
~~~
[[🧠Mind Map]]
>[!tip] 3️⃣Open the monthly note by:  
> - 💻 On desktop: `Ctrl + P` → *Periodic Notes: Open monthly note*
> - 📱 On mobile: Swipe down → *Periodic Notes: Open monthly note*
> - Follow the steps there to assign the monthly tag.

⏳⌛️
#### Next
>[!tip] 4️⃣Come back next year for a review! 😄
>- How did the year go?
>- What worked and what didn’t?
>- What will you do differently next time?

### ✍️Yearly Review:
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


