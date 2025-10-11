<%*
/*
 Task Template
 - Works with your router ("📌Task - <core>")
 - Reads the prefix from the filename
 - Adds a frontmatter `done` property (false by default)
 - One task per note, under "### My Task"
*/

const title   = (tp.file.title ?? "").trim();
const created = tp.file.creation_date("YYYY-MM-DD");

// Extract "<prefix>" and "<core>" from "<prefix><core>"
// Example title: "📌Task - Call Client"
const m = title.match(/^(.*?\bTask\s*-\s*)(.+)$/i);
const prefix = m ? m[1] : "📌Task - ";
const core   = (m ? m[2] : title).trim();

const lines = [
  "---",
  "_task_sync_state: false",
  "priority: Medium",           // High | Medium | Low
  "status: Active",             // Active | On Hold | Done
  `created: ${created}`,
  "due: ",                      // fill later
  "duration_hours: ",           // number
  "done: false",                // editable checkbox in Properties view
  "tags: []",                   // YAML array
  "---",
  "",
  "### My Task",
  `- [ ] ${prefix}${core}`,
  "",
];

tR = lines.join("\n");
%>

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
// Uses _task_sync_state for internal memory.
// Safe for Force Note View (runs only in Source mode).

// --- Safety guard: skip if not in Source mode ---
const mdView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
if (!mdView || mdView.getMode() !== "source") return;

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

  const updateOrInsert = (b, key, value) => {
    const re = new RegExp(`^\\s*${key}:\\s*.*$`, "m");
    return re.test(b)
      ? b.replace(re, `${key}: ${value}`)
      : b.replace(/\n---\s*$/, `\n${key}: ${value}\n---`);
  };

  if (nextDone !== null) block = updateOrInsert(block, "done", nextDone);
  if (typeof nextState === "boolean") block = updateOrInsert(block, "_task_sync_state", nextState);

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
