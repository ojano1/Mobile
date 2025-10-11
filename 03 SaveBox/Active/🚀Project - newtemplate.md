---
priority: Medium
status: Active
created: 2025-10-11
due:
done: false
tags: []
---

### My Project
- [ ] 🚀Project - newtemplate


### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
[[📌Task - te4st]]
'
'
[[🧠Mind Map]]
> [!tip] Step 2: Open task pages and confirm creation.
#### All tasks linked to this project:
~~~dataviewjs
// Show all notes that:
// - have "Task" in filename
// - do not end with "!"
// - are NOT in folders containing "Template" or "Archive"
// - have inlinks or outlinks to the current note

const hostPath = dv.current().file.path;
const hostNoExt = hostPath.replace(/\.md$/i, "");

const linkMatchesHost = l => {
  if (!l) return false;
  const p = (l.path ?? "").replace(/\.md$/i, "");
  return p === hostNoExt;
};

const pages = dv.pages()
  .where(p => p.file && p.file.name && p.file.folder)
  .where(p => p.file.name.includes("Task"))
  .where(p => !p.file.name.endsWith("!"))
  .where(p => !/Template/i.test(p.file.folder) && !/Archive/i.test(p.file.folder))
  .where(p => {
    const outs = (p.file.outlinks ?? []);
    const ins  = (p.file.inlinks ?? []);
    return outs.some(linkMatchesHost) || ins.some(linkMatchesHost);
  })
  .sort(p => p.file.name, 'asc');

dv.table(
  ["Note", "Done", "Due"],
  pages.map(p => [
    p.file.link,
    p.done ? "✅" : "⬜",
    p.due ? dv.date(p.due).toFormat("yyyy-MM-dd") : ""
  ])
);

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
### 🔗➡️Links  :
*Add goal links here if missing in the backlinks*

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


