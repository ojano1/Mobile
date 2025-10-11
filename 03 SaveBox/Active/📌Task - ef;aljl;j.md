---
_task_sync_state: false
priority: Medium
status: Active
created: 2025-10-11
due:
duration_hours:
done: false
tags: []
---

### My Task
- [ ] 📌Task - task ef;aljl;j


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
// Bidirectional silent sync between YAML `done`
// and the first checkbox under "My Task".
// Uses `_task_sync_state` in YAML for memory.
// No output. No extra inserts.

const file = app.workspace.getActiveFile();
if (!file) return;

const cache = app.metadataCache.getFileCache(file) ?? {};
const fm = cache.frontmatter ?? {};
const hasFM = !!cache.frontmatter;

const yamlDone =
  hasFM && typeof fm.done === "boolean" ? fm.done : null;
const prevState =
  hasFM && typeof fm._task_sync_state === "boolean" ? fm._task_sync_state : null;

const text = await app.vault.read(file);

// --- Helpers ---
const replaceInFM = (src, nextDone, nextState) => {
  const fmMatch = src.match(/^---\n[\s\S]*?\n---/);
  if (!fmMatch) return src;
  let block = fmMatch[0];

  // Update or insert "done"
  if (nextDone !== null) {
    block = /^\s*done:\s*/m.test(block)
      ? block.replace(/^\s*done:\s*.*/m, `done: ${nextDone}`)
      : block.replace(/\n---\s*$/, `\ndone: ${nextDone}\n---`);
  }

  // Update or insert "_task_sync_state"
  if (typeof nextState === "boolean") {
    block = /^\s*_task_sync_state:\s*/m.test(block)
      ? block.replace(/^\s*_task_sync_state:\s*.*/m, `_task_sync_state: ${nextState}`)
      : block.replace(/\n---\s*$/, `\n_task_sync_state: ${nextState}\n---`);
  }

  return src.replace(fmMatch[0], block);
};

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
  const m = taskRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
};

const setTaskChecked = (line, v) =>
  line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]");

// --- Main ---
if (!hasFM) return;

const range = findHeadingRange(text, "My Task");
if (!range) return;

const task = getFirstCheckbox(text, range);
if (!task) return;

const taskNow = task.checked;

// first run → adopt checkbox
if (prevState === null) {
  const updated = replaceInFM(text, taskNow, taskNow);
  if (updated !== text) await app.vault.modify(file, updated);
  return;
}

const yamlChanged = yamlDone !== null && yamlDone !== prevState;
const taskChanged = taskNow !== prevState;

let newText = text;

if (taskChanged) {
  // checkbox wins
  newText = replaceInFM(newText, taskNow, taskNow);
} else if (yamlChanged) {
  // YAML wins
  const newLine = setTaskChecked(task.line, yamlDone);
  newText = text.slice(0, task.absStart) + newLine + text.slice(task.absEnd);
  newText = replaceInFM(newText, yamlDone, yamlDone);
}

if (newText !== text) await app.vault.modify(file, newText);

```
