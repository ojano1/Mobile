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