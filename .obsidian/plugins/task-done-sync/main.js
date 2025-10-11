var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TaskDoneSync
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var TaskDoneSync = class extends import_obsidian.Plugin {
  async onload() {
    this.registerEvent(this.app.workspace.on("file-open", (file) => this.trySync(file)));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => this.trySync(file)));
  }
  async trySync(file) {
    if (!file) return;
    const cache = this.app.metadataCache.getFileCache(file) ?? {};
    const fm = cache.frontmatter ?? {};
    if (!cache.frontmatter) return;
    const yamlDone = typeof fm.done === "boolean" ? fm.done : null;
    const prevState = typeof fm._task_sync_state === "boolean" ? fm._task_sync_state : null;
    const { editor, inEdit } = this.getEditorFor(file);
    const text = inEdit ? editor.getValue() : await this.app.vault.read(file);
    const range = findHeadingRange(text, "My Task");
    if (!range) return;
    const task = getFirstCheckbox(text, range);
    if (!task) return;
    const taskNow = task.checked;
    if (prevState === null) {
      await this.updateFM(file, taskNow, taskNow);
      return;
    }
    const yamlChanged = yamlDone !== null && yamlDone !== prevState;
    const taskChanged = taskNow !== prevState;
    if (taskChanged) {
      await this.updateFM(file, taskNow, taskNow);
      return;
    }
    if (yamlChanged) {
      const newLine = setTaskChecked(task.line, yamlDone);
      await this.replaceRange(file, text, task.absStart, task.absEnd, newLine);
      await this.updateFM(file, yamlDone, yamlDone);
    }
  }
  getEditorFor(file) {
    const md = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const inEdit = !!md && md.file?.path === file.path && md.getMode() !== "preview";
    return { editor: md?.editor, inEdit };
  }
  async replaceRange(file, src, start, end, replacement) {
    const { editor, inEdit } = this.getEditorFor(file);
    if (inEdit && editor) {
      const from = editor.offsetToPos(start);
      const to = editor.offsetToPos(end);
      await new Promise(requestAnimationFrame);
      editor.replaceRange(replacement, from, to);
    } else {
      const next = src.slice(0, start) + replacement + src.slice(end);
      if (next !== src) await this.app.vault.modify(file, next);
    }
  }
  async updateFM(file, nextDone, nextState) {
    await this.app.fileManager.processFrontMatter(file, (m) => {
      if (nextDone !== null) m.done = !!nextDone;
      m._task_sync_state = !!nextState;
    });
  }
};
function findHeadingRange(src, name) {
  const re = new RegExp(`^#{1,6}\\s+${escapeRegex(name)}\\s*$`, "gim");
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const level = m[0].match(/^#+/)[0].length;
  const next = new RegExp(`^#{1,${level}}\\s+`, "gim");
  next.lastIndex = start;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length };
}
var taskRe = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/gim;
function getFirstCheckbox(src, range) {
  const slice = src.slice(range.start, range.end);
  taskRe.lastIndex = 0;
  const m = taskRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
}
function setTaskChecked(line, v) {
  return line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]");
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
