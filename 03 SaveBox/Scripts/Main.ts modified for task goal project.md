---
done: false
_goal_sync_state: false
---
// main.js — faster, more responsive sync for Task / Project / Goal
// Flags: _task_sync_state, _project_sync_state, _goal_sync_state

const { Plugin, MarkdownView } = require("obsidian");

// ---------- utils ----------
function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function findHeadingRange(src, name){
  const re = new RegExp(`^#{1,6}\\s+${escapeRegex(name)}\\s*$`, "gim");
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const level = (m[0].match(/^#+/) || ["#"])[0].length;
  const next = new RegExp(`^#{1,${level}}\\s+`, "gim");
  next.lastIndex = start;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length };
}
const boxRe = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/gim;
function getFirstCheckbox(src, range){
  if (!range) return null;
  const slice = src.slice(range.start, range.end);
  boxRe.lastIndex = 0;
  const m = boxRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
}
function setChecked(line, v){ return line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]"); }
function debounce(fn, wait){
  let t = null;
  return (...args)=>{
    if (t) clearTimeout(t);
    t = setTimeout(()=>{ fn(...args); t = null; }, wait);
  };
}

// ---------- plugin ----------
class TaskDoneSync extends Plugin {
  constructor(app, manifest){
    super(app, manifest);
    this.writing = new Set();
    this.syncDebounced = debounce(()=>this.syncActive(), 120);
  }

  async onload(){
    // Fires on most interactions
    this.registerEvent(this.app.workspace.on("file-open",   _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("layout-change", _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("editor-change", (_editor, _view) => this.syncDebounced()));

    // Fires on YAML/metadata updates and Reading view checkbox clicks
    this.registerEvent(this.app.metadataCache.on("changed", (_file) => this.syncDebounced()));
    this.registerEvent(this.app.metadataCache.on("resolved", _ => this.syncDebounced()));

    // Fires on disk-level content changes, incl. Reading view checkbox toggles
    this.registerEvent(this.app.vault.on("modify",   (_file) => this.syncDebounced()));
    this.registerEvent(this.app.vault.on("rename",   (_f, _old) => this.syncDebounced()));
    this.registerEvent(this.app.vault.on("create",   (_f) => this.syncDebounced()));
  }

  getEditorInfo(file){
    const md = this.app.workspace.getActiveViewOfType(MarkdownView);
    const isActive = !!md && md.file?.path === file.path;
    const inEdit = isActive && md.getMode() !== "preview";
    return { editor: md?.editor, inEdit };
  }

  async syncActive(){
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    if (this.writing.has(file.path)) return;

    const { editor, inEdit } = this.getEditorInfo(file);
    const text = inEdit ? editor.getValue() : await this.app.vault.read(file);

    const cache = this.app.metadataCache.getFileCache(file) ?? {};
    const fm = cache.frontmatter ?? {};
    if (!fm) return;

    const scopes = [
      { heading: "My Task",    flag: "_task_sync_state" },
      { heading: "My Project", flag: "_project_sync_state" },
      { heading: "My Goal",    flag: "_goal_sync_state" }
    ];

    for (const scope of scopes){
      const range = findHeadingRange(text, scope.heading);
      if (!range) continue;

      const box = getFirstCheckbox(text, range);
      if (!box) continue;

      const yamlDone = typeof fm.done === "boolean" ? fm.done : null;
      const prevState = typeof fm[scope.flag] === "boolean" ? fm[scope.flag] : null;
      const boxNow = box.checked;

      // First run → adopt checkbox
      if (prevState === null){
        await this.writeFM(file, { done: !!boxNow, [scope.flag]: !!boxNow });
        return;
      }

      const yamlChanged = yamlDone !== null && yamlDone !== prevState;
      const boxChanged  = boxNow !== prevState;

      if (boxChanged){
        await this.writeFM(file, { done: !!boxNow, [scope.flag]: !!boxNow });
        return;
      }

      if (yamlChanged){
        const newLine = setChecked(box.line, !!yamlDone);
        await this.replaceBody(file, text, box.absStart, box.absEnd, newLine);
        await this.writeFM(file, { [scope.flag]: !!yamlDone });
        return;
      }

      // Already in sync for this scope. Stop.
      return;
    }
  }

  async writeFM(file, patch){
    this.writing.add(file.path);
    try{
      await this.app.fileManager.processFrontMatter(file, (m)=>{
        for (const k of Object.keys(patch)) m[k] = patch[k];
      });
    } finally { this.writing.delete(file.path); }
  }

  async replaceBody(file, src, start, end, replacement){
    const { editor, inEdit } = this.getEditorInfo(file);
    this.writing.add(file.path);
    try{
      if (inEdit && editor){
        const from = editor.offsetToPos(start);
        const to   = editor.offsetToPos(end);
        await new Promise(requestAnimationFrame);
        editor.replaceRange(replacement, from, to);
      } else {
        const next = src.slice(0, start) + replacement + src.slice(end);
        if (next !== src) await this.app.vault.modify(file, next);
      }
    } finally { this.writing.delete(file.path); }
  }
}

module.exports = TaskDoneSync;