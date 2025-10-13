<%*
/*
 Goal Template
 - Works with your router ("🎯Goal - <core>")
 - Reads the prefix from the filename
 - Adds a frontmatter `done` property (false by default)
 - One goal per note, under "### My Goal"
*/

const title = (tp.file.title ?? "").trim();

// Extract "<prefix>" and "<core>" from "<prefix><core>"
// Example title: "🎯Goal - Launch v2"
const m = title.match(/^(.*?\bGoal\s*-\s*)(.+)$/i);
const prefix = m ? m[1] : "🎯Goal - ";
const core   = (m ? m[2] : title).trim();

const lines = [
  "---",
  "_goal_sync_state: false",
  "done: false",                // editable checkbox in Properties view
  "created: <% tp.file.creation_date("DD MMM YYYY") %>",
  "status: Active",             // Active | Archived
  "priority: Medium",           // High | Medium | Low
  "due: ",                      // fill later
  "duration_hours: ",           // number
  "tags: []",                   // YAML array
  "---",
  "",
  "### My Goal",
  `- [ ] ${prefix}${core}`,
  "",
];

tR = lines.join("\n");
%>

### 👷‍♂️Instructions:
> [!tip] Step 1: 🚀Create projects to realize this goal.
> - Think milestones, use verb, measurable amount, time duration (ideally 1 month max per project, split if needed).
> - Examples: “Set up a saving vault in 1 week”, “Save $250 each month”, “Build an expense tracker in 1 week”.
> - Create links to your project page using prefix `Project - `

### Type your projects here👇
[[Project - Example1]]
'
'
'
See the [[🧠Mind Map]] for a bird’s-eye view of your life.


> [!tip] Step 2: Work from the Project page
> - Open each project note.
> - Create tasks **in the project page**.

### All the projects linked to this goals:
~~~dataviewjs
// DataviewJS: child = Project notes (filename contains "Project").
// Parent = current Goal note (the host).
// Pull the FIRST task under "### My Project" from each related Project.
// Exclude Archive/Template and names ending with "!".
// UI: checkbox next to link. Second line shows "Due", Priority, Duration.
// Behavior: strike link + ✅ when done, hide meta, sync child YAML `done`.
// Host YAML `done` set true when all checked, false if any unchecked.
// Empty state message when none.

(async () => {
  const hostPath = dv.current().file.path; // Goal note path

  // ----- helpers -----
  const prRank = { High: 1, Medium: 2, Med: 2, Low: 3, A: 1, B: 2, C: 3, 1: 1, 2: 2, 3: 3 };
  const prShow = v => {
    if (v == null || v === "") return "";
    const s = String(v).trim();
    const map = { "1":"High","2":"Medium","3":"Low","A":"High","B":"Medium","C":"Low" };
    const key = s.toUpperCase();
    return map[key] || (s[0].toUpperCase() + s.slice(1).toLowerCase());
  };
  const toNumOrNull = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const fmtDue = v => v ? window.moment(v).format("DD MMM YYYY") : null;

  // ----- candidates: Project notes linking to this Goal -----
  const pages = dv.pages()
    .where(p => !/Archive|Template/i.test(p.file.path))
    .where(p => /Project/i.test(p.file.name) && !/[!]\s*$/.test(p.file.name))
    .where(p => {
      const ins = (p.file.inlinks ?? []).some(l => l.path === hostPath);
      const outs = (p.file.outlinks ?? []).some(l => l.path === hostPath);
      return ins || outs;
    });

  // ----- pick first task under "My Project" -----
  const rows = [];
  for (const p of pages) {
    const tasks = (p.file.tasks || []).filter(t => t.section?.subpath === "My Project");
    if (!tasks.length) continue;
    const first = tasks.sort((a, b) => a.line - b.line)[0];

    const checked = typeof p.done === "boolean" ? p.done : !!first.completed;
    const due = first.due ?? p.due ?? p.due_date ?? null;
    const pri = prShow(p.priority ?? p.prio ?? null);
    const durNum = toNumOrNull(p.duration_hours ?? p.duration ?? null);

    rows.push({
      path: p.file.path,
      text: first.text,
      checked,
      dueStr: fmtDue(due),
      dueKey: due ? window.moment(due).valueOf() : Number.POSITIVE_INFINITY,
      pri,
      priKey: prRank[(String(pri || "").split(" ")[0])] ?? 9,
      durNum,
      durKey: durNum == null ? 1e9 : durNum
    });
  }

  if (!rows.length) { dv.paragraph("Nothing here yet, go create some projects 🚀😃"); return; }

  // ----- sort -----
  rows.sort((a, b) => a.dueKey - b.dueKey || a.priKey - b.priKey || a.durKey - b.durKey);

  // ----- render -----
  const list = document.createElement("ul");
  list.style.listStyle = "none";
  list.style.padding = "0";
  list.style.margin = "0";

  // host done <- current UI state
  const updateHostDoneFromUI = async () => {
    const allDone = Array.from(list.querySelectorAll('input[type="checkbox"]')).every(x => x.checked);
    const hostFile = app.vault.getAbstractFileByPath(hostPath);
    if (!hostFile) return;
    await app.fileManager.processFrontMatter(hostFile, fm => { fm.done = allDone; });
  };

  for (const r of rows) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.flexDirection = "column";
    li.style.gap = "2px";
    li.style.padding = "4px 0";

    // row 1: checkbox + link
    const row1 = document.createElement("div");
    row1.style.display = "flex";
    row1.style.alignItems = "center";
    row1.style.gap = "8px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = r.checked;

    const link = document.createElement("a");
    link.textContent = r.text;
    link.href = "#";
    link.onclick = e => { e.preventDefault(); app.workspace.openLinkText(r.path, dv.current().file.path, false); };

    const doneMark = document.createElement("span");
    doneMark.textContent = " ✅";
    doneMark.style.display = r.checked ? "inline" : "none";

    row1.append(cb, link, doneMark);

    // row 2: YAML meta
    const row2 = document.createElement("div");
    row2.style.opacity = "0.8";
    row2.style.marginLeft = "26px"; // align under link
    const bits = [];
    if (r.dueStr) bits.push(`Due ${r.dueStr}`);
    if (r.pri) bits.push(r.pri);
    if (r.durNum != null) bits.push(`${r.durNum} hr${r.durNum === 1 ? "" : "s"}`);
    row2.textContent = bits.length ? "· " + bits.join(" · ") : "";

    const applyDoneStyle = done => {
      link.style.textDecoration = done ? "line-through" : "none";
      row2.style.display = done ? "none" : "block";
      doneMark.style.display = done ? "inline" : "none";
    };
    applyDoneStyle(r.checked);

    // sync child YAML + update host YAML
    cb.addEventListener("change", async () => {
      const f = app.vault.getAbstractFileByPath(r.path);
      if (!f) return;
      await app.fileManager.processFrontMatter(f, fm => { fm.done = cb.checked; });
      applyDoneStyle(cb.checked);
      await updateHostDoneFromUI();
    });

    li.append(row1, row2);
    list.appendChild(li);
  }

  // set host done based on initial state
  await updateHostDoneFromUI();

  dv.container.append(list);
})();
~~~
> [!tip] Step 3: ✅(Optional) Create done criteria
> - Outcome, amount, or result
> - Deadline
> - How you will verify

#### ✅Done Criteria:
'
'
'
'
___
### ✍️Comments:
'
'
'
'
___

### 🔗➡️Links:
*Add Area links here if none in backlinks section.*
'
'
'
'
___
### 🔗⬅️Backlinks:
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
