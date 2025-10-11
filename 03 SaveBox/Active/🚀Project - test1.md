---
_project_sync_state: false
done: false
status: Active
priority: Medium
due: 2025-10-11
duration_hours:
tags: []
---

### My Project
- [ ] 🚀Project - test1


### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
'
'
'
[[🧠Mind Map]]
> [!tip] Step 2: Open task pages and confirm creation.
#### All tasks linked to this project:
~~~dataview
LIST
FROM ""
WHERE contains(file.name, "Task")
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

```dataviewjs
// YAML `done` ↔ first checkbox under "My Project"
// Internal flag: _project_sync_state
// Runs in any Markdown mode

const mdView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
if (!mdView) return;

const file = app.workspace.getActiveFile();
if (!file) return;

const cache = app.metadataCache.getFileCache(file) ?? {};
const fm = cache.frontmatter ?? {};
const hasFM = !!cache.frontmatter;

const yamlDone = hasFM && typeof fm.done === "boolean" ? fm.done : null;
const prevState = hasFM && typeof fm._project_sync_state === "boolean" ? fm._project_sync_state : null;

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

const range = findHeadingRange(text, "My Project");
if (!range) return;

const cb = getFirstCheckbox(text, range);
if (!cb) return;

const boxNow = cb.checked;

// First run adopts checkbox
if (prevState === null) {
  await app.fileManager.processFrontMatter(file, f => {
    f.done = !!boxNow;
    f._project_sync_state = !!boxNow;
  });
  return;
}

const yamlChanged = yamlDone !== null && yamlDone !== prevState;
const boxChanged = boxNow !== prevState;

if (boxChanged) {
  // Checkbox wins → update YAML
  await app.fileManager.processFrontMatter(file, f => {
    f.done = !!boxNow;
    f._project_sync_state = !!boxNow;
  });
  return;
}

if (yamlChanged) {
  // YAML wins → update checkbox
  const newLine = setChecked(cb.line, !!yamlDone);
  const newText = text.slice(0, cb.absStart) + newLine + text.slice(cb.absEnd);
  if (newText !== text) await app.vault.modify(file, newText);
  await app.fileManager.processFrontMatter(file, f => {
    f._project_sync_state = !!yamlDone;
  });
}

```
