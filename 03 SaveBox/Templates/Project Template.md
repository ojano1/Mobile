<%*
/*
 Project Template
 - Uses router rename ("🚀Project - <core>")
 - Adds `done` property (false by default)
 - Single main checkbox under “My Project” callout
*/

const PREFIX  = "🚀Project - ";
const title   = (tp.file.title ?? "").trim();
const created = tp.file.creation_date("YYYY-MM-DD");

// Extract text after last "-"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*project\b\s*/i, "").trim();
if (!core) core = "Untitled";

const lines = [
  "---",
  "priority: Medium",         // High | Medium | Low
  "status: Active",           // Active | On Hold | Done
  `created: ${created}`,
  "due: ",                    // fill later
  "done: false",              // editable checkbox property
  "tags: []",                 // YAML array
  "---",
  "",
  "### My Project",
  `- [ ] ${PREFIX}${core}`,
  "",
];

tR = lines.join("\n");
%>

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
// Bidirectional silent sync between YAML `done`
// and the first checkbox under "My Project".
// Uses _task_sync_state for internal memory.
// Forces Dataview refresh for responsiveness.

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

// --- helpers ---
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

// allow blockquote / indent before "- [ ]"
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

// --- main ---
if (!hasFM) return;

const range = findHeadingRange(text, "My Project");
if (!range) return;

const task = getFirstCheckbox(text, range);
if (!task) return;

const taskNow = task.checked;

// first run → adopt checkbox
if (prevState === null) {
  const updated = replaceInFM(text, taskNow, taskNow);
  if (updated !== text) {
    await app.vault.modify(file, updated);
    app.workspace.trigger("dataview:refresh-views");
  }
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

// Apply change with minimal debounce and forced refresh
if (newText !== text) {
  await new Promise(r => setTimeout(r, 100)); // short delay for smoothness
  await app.vault.modify(file, newText);
  app.workspace.trigger("dataview:refresh-views");
}

```