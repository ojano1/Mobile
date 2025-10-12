// main.js — sync YAML `done` with first checkbox under My Task / My Project / My Goal
// Ignores Area / Note / Habit notes entirely
// Applies the 2s "new file" delay ONLY to Task/Project/Goal notes

const { Plugin, MarkdownView } = require("obsidian");

// ---------- helpers ----------
function escapeRx(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function findHeadingRange(src, name){
  const re = new RegExp(`^#{1,6}\\s+${escapeRx(name)}\\s*$`, "gim");
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
  return (...args)=>{ if (t) clearTimeout(t); t = setTimeout(()=>{ t = null; fn(...args); }, wait); };
}

// ----- template/race guards -----
const SKIP_NEWFILE_MS = 2000;
function isTemplatePath(path){ return /(^|\/)(templates?|Templates?)(\/|$)/.test(path); }
function isTemplateFM(fm){ return fm?.template === true || fm?.is_template === true || fm?.type === "template"; }
function hasTemplaterTags(text){ return /<%[\s\S]*?%>/.test(text); }
function isTooNew(file){ const c = file?.stat?.ctime ?? 0; return Date.now() - c < SKIP_NEWFILE_MS; }

// ---------- plugin ----------
class TaskDoneSync extends Plugin {
  constructor(app, manifest){
    super(app, manifest);
    this.writing = new Set();
    this.syncDebounced = debounce(()=>this.syncActive(), 150);
  }

  async onload(){
    // responsiveness
    this.registerEvent(this.app.workspace.on("file-open",   _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("layout-change", _ => this.syncDebounced()));
    this.registerEvent(this.app.workspace.on("editor-change", (_editor, _view) => this.syncDebounced()));
    this.registerEvent(this.app.metadataCache.on("changed", (_file) => this.syncDebounced()));
    this.registerEvent(this.app.metadataCache.on("resolved", _ => this.syncDebounced()));
    this.registerEvent(this.app.vault.on("modify",   (_file) => this.syncDebounced()));
    this.registerEvent(this.app.vault.on("rename",   (_f, _old) => this.syncDebounced()));
    this.registerEvent(this.app.vault.on("create",   (_f) => this.syncDebounced()));

    // hide “modified externally” popup for our writes
    this.registerEvent(this.app.vault.on("modify", file => {
      if (this.writing.has(file.path)) {
        if (this.app?.notifier?.hideAll) this.app.notifier.hideAll();
      }
    }));
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
    if (isTemplatePath(file.path)) return;

    const cache = this.app.metadataCache.getFileCache(file) ?? {};
    const fm = cache.frontmatter ?? {};
    if (isTemplateFM(fm)) return;

    const { editor, inEdit } = this.getEditorInfo(file);
    const text = inEdit && editor ? editor.getValue() : await this.app.vault.read(file);
    if (!text) return;
    if (hasTemplaterTags(text)) return;

    // act ONLY on Task / Project / Goal notes
    const isTarget = /^#{1,6}\s+My\s+(Task|Project|Goal)\s*$/im.test(text);
    if (!isTarget) return; // ignore Area / Note / Habit / anything else

    // apply the new-file delay ONLY to target notes
    if (isTooNew(file)) return;

    if (this.writing.has(file.path)) return;

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

      const yamlDone  = typeof fm.done === "boolean" ? fm.done : null;
      const prevState = typeof fm[scope.flag] === "boolean" ? fm[scope.flag] : null;
      const boxNow = box.checked;

      // first run → adopt checkbox
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

      return; // already in sync for this scope
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