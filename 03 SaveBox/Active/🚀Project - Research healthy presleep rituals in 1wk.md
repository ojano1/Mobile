---
priority: Medium
status: Active
create date: 2025-10-10
due:
---

Tags (start with # and a letter): #Oct

> [!success] My Project
> - [ ] 🚀Project - Research healthy presleep rituals in 1wk
### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
[[📌Task - tes trasclucen]]
[[📌Task - tes trans2]]
'[[📌Task - Find 10 causes of sleep lack in 15mins]]
'[[📌Task - Find 10 ways to enhance sleep in 15mins]]
'[[Task Find 10 sunnah about sleep in 15mins]]
[[🧠Mind Map]]

> [!tip] Step 2: Open task pages and confirm creation.
#### All tasks linked to this project:
~~~dataviewjs
/***** CONFIG *****/
const FOLDERS = [
  "01 Definition",
  "02 Execution",
  "03 SaveBox/Active",
  "04 Output"
];

/***** HELPERS *****/
const linkPath = l => {
  const raw = typeof l === "string" ? l : (l?.path ?? l?.file?.path ?? "");
  const pg = dv.page(raw);
  return pg ? pg.file.path : raw;
};

const thisPath = dv.current().file.path;

const tasks = dv.pages()
  .where(p =>
    /task/i.test(p.file.name) &&
    FOLDERS.some(f => p.file.folder?.startsWith(f)) &&
    (
      (p.file.outlinks ?? []).some(l => linkPath(l) === thisPath) ||
      (dv.current().file.outlinks ?? []).some(l => linkPath(l) === p.file.path)
    )
  )
  .sort(p => p.file.name);

/***** RENDER *****/
if (tasks.length === 0) {
  dv.paragraph("No linked task checkboxes detected.");
} else {
  // Build Markdown string with actual embeds (no <ul> wrapper)
  const embeds = [];
  for (const t of tasks) {
    const file = app.vault.getAbstractFileByPath(t.file.path);
    if (!file) continue;
    const src = await app.vault.read(file);

    // find the first checkbox line with a block ID (^t-...)
    const match = src.match(/-\s*\[(?: |x)\]\s.*\^([A-Za-z0-9\-_]+)/);
    if (!match) continue;

    const blockId = match[1];
    embeds.push(`![[${t.file.name}#^${blockId}]]`);
  }

  if (embeds.length > 0) {
    dv.el("div", embeds.join("\n")); // Let Obsidian render the markdown
  } else {
    dv.paragraph("No linked task checkboxes detected.");
  }
}
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


