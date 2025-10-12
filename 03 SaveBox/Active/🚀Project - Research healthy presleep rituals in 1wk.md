---
priority: Medium
status: Active
create date: 2025-10-10
due:
done: false
_project_sync_state: false
---

Tags (start with # and a letter): #Oct
### My Project
- [ ] 🚀Project - Research healthy presleep rituals in 1wk

### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
[[📌Task - tes trasclucen]]
[[📌Task - tes trans2]]
'[[📌Task - Find 10 causes of sleep lack in 15mins fjfbhdjdjdndb]]
'[[📌Task - Find 10 ways to enhance sleep in 15mins]]
'[[Task Find 10 sunnah about sleep in 15mins]]
[[🧠Mind Map]]

> [!tip] Step 2: Open task pages and confirm creation.
#### All tasks linked to this project:
~~~dataviewjs
// DataviewJS: first task under "### My Task" from related Task notes
// Layout: checkbox next to link, YAML on second line, "Due" prefix
// Behavior: strike link + ✅ when done, hide meta, sync each task note's YAML `done`,
// set host YAML `done: true` when all checked, set `false` if any unchecked,
// empty state message when none.

(async () => {
  const hostPath = dv.current().file.path;

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

  // ----- candidates -----
  const pages = dv.pages()
    .where(p => !/Archive|Template/i.test(p.file.path))
    .where(p => /Task/i.test(p.file.name) && !/[!]\s*$/.test(p.file.name))
    .where(p => {
      const ins = (p.file.inlinks ?? []).some(l => l.path === hostPath);
      const outs = (p.file.outlinks ?? []).some(l => l.path === hostPath);
      return ins || outs;
    });

  // ----- pick first task under "My Task" -----
  const rows = [];
  for (const p of pages) {
    const tasks = (p.file.tasks || []).filter(t => t.section?.subpath === "My Task");
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

  if (!rows.length) { dv.paragraph("Nothing here yet, go create some tasks 🙂"); return; }

  // ----- sort -----
  rows.sort((a, b) => a.dueKey - b.dueKey || a.priKey - b.priKey || a.durKey - b.durKey);

  // ----- render -----
  const list = document.createElement("ul");
  list.style.listStyle = "none";
  list.style.padding = "0";
  list.style.margin = "0";

  // helper to update host YAML based on current checkboxes
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

    // sync YAML on change + update host done true/false
    cb.addEventListener("change", async () => {
      const f = app.vault.getAbstractFileByPath(r.path);
      if (!f) return;
      await app.fileManager.processFrontMatter(f, fm => { fm.done = cb.checked; });
      applyDoneStyle(cb.checked);
      await updateHostDoneFromUI(); // <-- set true or false based on all checkboxes
    });

    li.append(row1, row2);
    list.appendChild(li);
  }

  // set host done based on initial state
  await (async () => { await updateHostDoneFromUI(); })();

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
#### ✍️Comments:
'
'
'
'
___
#### 🔗➡️Links  :
*Add goal links here if missing in the backlinks.*


#### 🔗⬅️Backlinks:
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


