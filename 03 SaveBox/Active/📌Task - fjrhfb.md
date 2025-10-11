---
_task_sync_state: true
priority: Medium
status: Active
created: 2025-10-11
due: 2025-10-11
duration_hours:
done: true
tags: []
---

### My Task
- [x] 📌Task - Task fjrhfb


### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output

### ✍️Description  
''
___

### ✅Done Criteria  
''
___

### 🔗➡️Links:
*Add project links here if missing*

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

if (backlinks.length) dv.list(backlinks.map(p => p.file.link));
else dv.paragraph("None");
~~~

```dataviewjs
// Bidirectional silent sync between YAML `done` and
// the first checkbox under "My Task".
// Uses `_task_sync_state` in YAML for memory.

const file = app.workspace.getActiveFile();
if (!file) return;

const mdView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
const inEdit = !!mdView && mdView.getMode() !== "preview";
const editor = mdView?.editor;

const cache = app.metadataCache.getFileCache(file) ?? {};
const fm = cache.frontmatter ?? {};
const hasFM = !!cache.frontmatter;

const yamlDone =
  hasFM && typeof fm.done === "boolean" ? fm.done : null;
const prevState =
  hasFM && typeof fm._task_sync_state === "boolean" ? fm._task_sync_state : null;

const readText = async () => (inEdit ? editor.getValue() : await app.vault.read(file));

const writeWhole = async (next) => {
  if (inEdit) {
    if (editor.getValue() !== next) editor.setValue(next);
  } else {
    if ((await app.vault.read(file)) !== next) await app.vault.modify(file, next);
  }
};

const replaceRange = async (src, start, end, replacement) => {
  if (inEdit) {
    const from = editor.offsetToPos(start);
    const to = editor.offsetToPos(end);
    editor.replaceRange(replacement, from, to);
  } else {
    const next = src.slice(0, start) + replacement + src.slice(end);
    if (next !== src) await app.vault.modify(file, next);
  }
};

const updateFM = async (nextDone, nextState) => {
  await app.fileManager.processFrontMatter(file, (m) => {
    if (nextDone !== null) m.done = !!nextDone;
    if (typeof nextState === "boolean") m._task_sync_state = nextState;
  });
};

// --- helpers ---
const findHeadingRange = (src, name) => {
  const re = new RegExp(`^#{1,6}\\s+${name}\\s*$`, "gim");
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const level = m[0].match(/^#+/)[0].length;
  const next = new RegExp(`^#{1,${level}}\\s+`, "gim");
  next.lastIndex = start;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length };
};

// allow "> - [ ]" etc.
const taskRe = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/gim;

const getFirstCheckbox = (src, range) => {
  if (!range) return null;
  const slice = src.slice(range.start, range.end);
  taskRe.lastIndex = 0;
  const m = taskRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
};

const setTaskChecked = (line, v) =>
  line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]");

// --- main ---
if (!hasFM) return;

const text = await readText();
const range = findHeadingRange(text, "My Task");
if (!range) return;

const task = getFirstCheckbox(text, range);
if (!task) return;

const taskNow = task.checked;

// first run → adopt checkbox into YAML and memory, no body edit
if (prevState === null) {
  await updateFM(taskNow, taskNow);
  return;
}

const yamlChanged = yamlDone !== null && yamlDone !== prevState;
const taskChanged = taskNow !== prevState;

if (taskChanged) {
  // checkbox wins → set YAML done + memory to checkbox
  await updateFM(taskNow, taskNow);
} else if (yamlChanged) {
  // YAML wins → toggle the checkbox line in the current buffer/file, then update YAML memory
  const newLine = setTaskChecked(task.line, yamlDone);
  await replaceRange(text, task.absStart, task.absEnd, newLine);
  await updateFM(yamlDone, yamlDone);
}
// else nothing changed

```
