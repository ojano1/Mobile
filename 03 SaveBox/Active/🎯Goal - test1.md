---
_goal_sync_state: false
done: false
status: Active
priority: Medium
due: 2025-10-11
duration_hours:
tags: []
---

### My Goal
- [ ] 🎯Goal - goal test1


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
[[🧠Mind Map]]


> [!tip] Step 2: Work from the Project page
> - Open each project note.
> - Create tasks **in the project page**.

### All the projects linked to this goals:
~~~dataviewjs
const projects = dv.pages("")
  .where(p =>
    p.file.name.includes("Project") &&
    !p.file.folder.includes("Archive") &&
    !p.file.folder.includes("Template") &&
    (
      p.file.folder.startsWith("01 Definition") ||
      p.file.folder.startsWith("02 Execution") ||
      p.file.folder.startsWith("03 SaveBox/Active") ||
      p.file.folder.startsWith("04 Output")
    ) &&
    (
      dv.current().file.outlinks.includes(p.file.link) ||
      p.file.outlinks.includes(dv.current().file.link)
    )
  )
  .sort(p => p.file.name, "asc");

if (projects.length) {
  dv.list(projects.map(p => p.file.link));
} else {
  dv.paragraph("Start adding projects! 😊");
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

```dataviewjs
// YAML `done` ↔ first checkbox under "My Goal"
// Internal flag: _goal_sync_state
// Runs in any Markdown mode

const mdView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
if (!mdView) return;

const file = app.workspace.getActiveFile();
if (!file) return;

const cache = app.metadataCache.getFileCache(file) ?? {};
const fm = cache.frontmatter ?? {};
const hasFM = !!cache.frontmatter;

const yamlDone = hasFM && typeof fm.done === "boolean" ? fm.done : null;
const prevState = hasFM && typeof fm._goal_sync_state === "boolean" ? fm._goal_sync_state : null;

const text = await app.vault.read(file);

// Helpers
const findHeadingRange = (src, name) => {
  const re = new RegExp(`^#{1,6}\\s+${name}\\s*$`, "gim");
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const level = (m[0].match(/^#+/) || ["#"])[0].length;
  const next = new RegExp(`^#{1,${level}}\\s+`, "gim");
  next.lastIndex = start;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length };
};

const boxRe = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/gim;

const getFirstCheckbox = (src, range) => {
  if (!range) return null;
  const slice = src.slice(range.start, range.end);
  boxRe.lastIndex = 0;
  const m = boxRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
};

const setChecked = (line, v) => line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]");

// Main
if (!hasFM) return;

const range = findHeadingRange(text, "My Goal");
if (!range) return;

const cb = getFirstCheckbox(text, range);
if (!cb) return;

const boxNow = cb.checked;

// First run adopts checkbox
if (prevState === null) {
  await app.fileManager.processFrontMatter(file, f => {
    f.done = !!boxNow;
    f._goal_sync_state = !!boxNow;
  });
  return;
}

const yamlChanged = yamlDone !== null && yamlDone !== prevState;
const boxChanged = boxNow !== prevState;

if (boxChanged) {
  // Checkbox wins → update YAML
  await app.fileManager.processFrontMatter(file, f => {
    f.done = !!boxNow;
    f._goal_sync_state = !!boxNow;
  });
  return;
}

if (yamlChanged) {
  // YAML wins → update checkbox
  const newLine = setChecked(cb.line, !!yamlDone);
  const newText = text.slice(0, cb.absStart) + newLine + text.slice(cb.absEnd);
  if (newText !== text) await app.vault.modify(file, newText);
  await app.fileManager.processFrontMatter(file, f => {
    f._goal_sync_state = !!yamlDone;
  });
}
```
