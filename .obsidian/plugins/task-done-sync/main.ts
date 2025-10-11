import { App, MarkdownView, Plugin, TFile } from "obsidian";

export default class TaskDoneSync extends Plugin {
  async onload() {
    // Run on open and when metadata changes after a save.
    this.registerEvent(this.app.workspace.on("file-open", (file) => this.trySync(file)));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => this.trySync(file)));
  }

  private async trySync(file: TFile | null) {
    if (!file) return;

    // Optional scope:
    // if (!file.path.startsWith("Tasks/")) return;

    const cache = this.app.metadataCache.getFileCache(file) ?? {};
    const fm = cache.frontmatter ?? {};
    if (!cache.frontmatter) return;

    const yamlDone = typeof fm.done === "boolean" ? (fm.done as boolean) : null;
    const prevState =
      typeof fm._task_sync_state === "boolean" ? (fm._task_sync_state as boolean) : null;

    const { editor, inEdit } = this.getEditorFor(file);
    const text = inEdit ? editor!.getValue() : await this.app.vault.read(file);

    const range = findHeadingRange(text, "My Task");
    if (!range) return;

    const task = getFirstCheckbox(text, range);
    if (!task) return;

    const taskNow = task.checked;

    if (prevState === null) {
      // First run. Adopt checkbox into YAML and memory.
      await this.updateFM(file, taskNow, taskNow);
      return;
    }

    const yamlChanged = yamlDone !== null && yamlDone !== prevState;
    const taskChanged = taskNow !== prevState;

    if (taskChanged) {
      // Checkbox wins. Write to YAML.
      await this.updateFM(file, taskNow, taskNow);
      return;
    }

    if (yamlChanged) {
      // YAML wins. Update checkbox line, then memory.
      const newLine = setTaskChecked(task.line, yamlDone!);
      await this.replaceRange(file, text, task.absStart, task.absEnd, newLine);
      await this.updateFM(file, yamlDone!, yamlDone!);
    }
  }

  private getEditorFor(file: TFile) {
    const md = this.app.workspace.getActiveViewOfType(MarkdownView);
    const inEdit = !!md && md.file?.path === file.path && md.getMode() !== "preview";
    return { editor: md?.editor, inEdit };
  }

  private async replaceRange(file: TFile, src: string, start: number, end: number, replacement: string) {
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

  private async updateFM(file: TFile, nextDone: boolean | null, nextState: boolean) {
    await this.app.fileManager.processFrontMatter(file, (m) => {
      if (nextDone !== null) m.done = !!nextDone;
      m._task_sync_state = !!nextState;
    });
  }
}

/** Utils */

function findHeadingRange(src: string, name: string) {
  const re = new RegExp(`^#{1,6}\\s+${escapeRegex(name)}\\s*$`, "gim");
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length;
  const level = m[0].match(/^#+/)![0].length;
  const next = new RegExp(`^#{1,${level}}\\s+`, "gim");
  next.lastIndex = start;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length };
}

const taskRe = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/gim;

function getFirstCheckbox(src: string, range: { start: number; end: number }) {
  const slice = src.slice(range.start, range.end);
  taskRe.lastIndex = 0;
  const m = taskRe.exec(slice);
  if (!m) return null;
  const absStart = range.start + m.index;
  const absEnd = absStart + m[0].length;
  const checked = /\[(x|X)\]/.test(m[0]);
  return { absStart, absEnd, line: m[0], checked };
}

function setTaskChecked(line: string, v: boolean) {
  return line.replace(/\[(?: |x|X)\]/, v ? "[x]" : "[ ]");
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}