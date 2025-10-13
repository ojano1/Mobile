---
priority: Medium
status: Active
create date: 2025-10-10
due: 2025-10-12
duration_hours: "0.25"
done: false
_task_sync_state: false
timeslot: Morning
---

Tags (start with # and a letter):

### My Task
- [ ] 📌Task - Find 10 ways to enhance sleep in 15 mins

### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add more details
> - Add description
> - Estimate hour duration in the property
> - Define the output of this task.

### ✍️Desriptions:
'Use AI to reaserch and make output note.
___

> [!tip] Step 2: Open each tasks to confirm it's created.

### All tasks linked to this project:
~~~dataview
LIST
FROM ""
WHERE contains(file.name, "Project")
AND (
  startswith(file.folder, "01 Definition")
  OR startswith(file.folder, "02 Execution")
  OR startswith(file.folder, "03 SaveBox/Active")
  OR startswith(file.folder, "04 Output")
)
AND (
  contains(this.file.outlinks, file.link)
  OR contains(file.outlinks, this.file.link)
)
SORT file.name ASC
~~~

> [!tip] Step 3: ✅(Optional) Define done criteria  
> - Outcome, amount, or result  
> - Deadline  
> - How you will verify  

### ✅Done Criteria:
'
'
'
'
### ✍️Comments:
'
'
'
'
___
### Links
~~~dataviewjs
// 📅 Daily + Mind Map on top, then linked/backlink notes (A–Z)
// For Task/Project/Goal: show Done / Not Done instead of date
// Do not duplicate the daily note link

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

const dailyFile = todays.length ? todays[0].file : null;
const dailyPath = dailyFile?.path ?? null;
const daily = dailyFile ? dailyFile.link : "None";

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

// unique, drop daily note, sort A–Z
const unique = Array.from(new Map([...linked, ...backlinks].map(p => [p.file.path, p])).values())
  .filter(p => p.file.path !== dailyPath)
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
