/* setPlanCalendar.js
 * One-hotkey planner for task notes:
 *  - ⏰ Slot: Morning / Afternoon / Evening           -> fm.slot
 *  - 📅 Daily plan: pick a date                       -> fm.dplan (+ optional fm.due)
 *  - 🗓 Weekly plan: pick a Monday (ISO)              -> fm.wplan
 *  - 📆 Monthly plan: pick a month                    -> fm.mplan (YYYY-MM-01)
 *  - 🗓 Yearly plan: pick a year                      -> fm.yplan (YYYY-01-01)
 *  - 📌 Due date: pick a date                         -> fm.due
 *  - 🎯 Priority: high / medium / low / clear         -> fm.priority (lowercase)
 *  - 🧹 Clear planning dates (only dates, not slot)   -> clears due/dplan/wplan/mplan/yplan
 *  - 📦 Archive note: set archived date + move file   -> moves to ARCHIVE_DIR
 *
 * Context-aware pickers:
 *  - Weekly note (frontmatter.week_start): Daily shows that week’s 7 days
 *  - Monthly note (frontmatter.month): Weekly shows Mondays inside that month
 *  - Yearly note (frontmatter.year = "YYYY-01-01"): Monthly shows 12 months of that year
 */

const ARCHIVE_DIR = "05 Archive"; // change if you prefer a different archive folder

module.exports = async (params) => {
  const { app, quickAddApi: qa } = params;
  const file = app.workspace.getActiveFile();
  if (!file) { new Notice("Open a task note first."); return; }

  const getFM = (f) => app.metadataCache.getFileCache(f)?.frontmatter || {};
  const fmt = (m, f) => window.moment(m).format(f);

  // Detect dashboard context (monthly/weekly/yearly notes)
  const activeView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
  const ctxFile = activeView?.file;
  const ctxFM = ctxFile ? getFM(ctxFile) : {};

  // Helpers
  const setFM = async (mutator) =>
    app.fileManager.processFrontMatter(file, (fm) => mutator(fm));

  const ensureFolder = async (folderPath) => {
    const exists = app.vault.getAbstractFileByPath(folderPath);
    if (!exists) {
      try { await app.vault.createFolder(folderPath); } catch (_) { /* ignore if race */ }
    }
  };

  const moveWithCollisionSafeName = async (toFolder, theFile) => {
    await ensureFolder(toFolder);
    const base = theFile.name.replace(/\\/g, "/");
    let targetPath = ${toFolder}/${base};
    let i = 1;
    while (app.vault.getAbstractFileByPath(targetPath)) {
      const extIdx = base.lastIndexOf(".");
      const name = extIdx > -1 ? base.slice(0, extIdx) : base;
      const ext  = extIdx > -1 ? base.slice(extIdx) : "";
      targetPath = ${toFolder}/${name} (${i})${ext};
      i++;
    }
    await app.fileManager.renameFile(theFile, targetPath);
    return targetPath;
  };

  // Main menu
  const mainLabels = [
    "⏰ Slot (Morning / Afternoon / Evening)",
    "📅 Daily plan (pick a date)",
    "🗓 Weekly plan (pick a week)",
    "📆 Monthly plan (pick a month)",
    "🗓 Yearly plan (pick a year)",
    "📌 Due date (direct set)",
    "🎯 Priority (high / medium / low / clear)",
    "🧹 Clear planning dates (due/dplan/wplan/mplan/yplan)",
    "📦 Archive note (move to archive folder)"
  ];
  const mainValues = ["slot", "daily", "weekly", "monthly", "yearly", "due", "priority", "cleardates", "archive"];
  const mainChoice = await qa.suggester(mainLabels, mainValues);
  if (!mainChoice) return;

  // ===== SLOT =====
  if (mainChoice === "slot") {
    const slotLabels = ["🌅 Morning", "🌞 Afternoon", "🌙 Evening", "❌ Clear slot"];
    const slotValues = ["Morning", "Afternoon", "Evening", null];
    const slotChoice = await qa.suggester(slotLabels, slotValues);
    if (slotChoice === undefined) return;
    await setFM((fm) => { if (slotChoice) fm.slot = slotChoice; else delete fm.slot; });
    new Notice(Slot ${slotChoice ? "set to " + slotChoice : "cleared"});
    return;
  }

  // ===== DAILY =====
  if (mainChoice === "daily") {
    let labels = [], values = [];
    if (ctxFM.week_start) {
      const start = window.moment(ctxFM.week_start).startOf("day");
      for (let i = 0; i < 7; i++) {
        const d = start.clone().add(i, "day");
        labels.push(fmt(d, "ddd, DD MMM YYYY"));
        values.push(fmt(d, "YYYY-MM-DD"));
      }
    } else {
      const today = window.moment().startOf("day");
      for (let i = 0; i < 30; i++) {
        const d = today.clone().add(i, "day");
        const prefix = (d.isoWeekday() === 1) ? `W${d.isoWeek()} • ` : "   ";
        labels.push(${prefix}${fmt(d, "ddd, DD MMM YYYY")});
        values.push(fmt(d, "YYYY-MM-DD"));
      }
    }
    const pick = await qa.suggester(labels, values);
    if (!pick) return;

    const alsoDue = await qa.suggester(["✅ Also set due date", "❌ Only set dplan"], [true, false]);
    await setFM((fm) => { fm.dplan = pick; if (alsoDue) fm.due = pick; });
    new Notice(Day plan → ${window.moment(pick).format("ddd, DD MMM YYYY")}${alsoDue ? " (due set)" : ""});
    return;
  }

  // ===== WEEKLY =====
  if (mainChoice === "weekly") {
    let labels = [], values = [];
    if (ctxFM.month) {
      const monthStart = window.moment(ctxFM.month).startOf("month");
      const monthEnd   = window.moment(ctxFM.month).endOf("month");
      let cur = monthStart.clone().startOf("isoWeek");
      if (cur.isBefore(monthStart)) cur.add(1, "week");
      while (cur.isSameOrBefore(monthEnd)) {
        labels.push(W${cur.isoWeek()} — ${fmt(cur, "ddd, DD MMM YYYY")});
        values.push(fmt(cur, "YYYY-MM-DD")); // Monday anchor
        cur.add(1, "week");
      }
    } else {
      let cur = window.moment().startOf("isoWeek");
      for (let i = 0; i < 8; i++) {
        const d = cur.clone().add(i, "week");
        labels.push(W${d.isoWeek()} — ${fmt(d, "ddd, DD MMM YYYY")});
        values.push(fmt(d, "YYYY-MM-DD"));
      }
    }
    const pick = await qa.suggester(labels, values);
    if (!pick) return;

    await setFM((fm) => { fm.wplan = pick; });
    new Notice(Week plan → W${window.moment(pick).isoWeek()} (${window.moment(pick).format("DD MMM YYYY")}));
    return;
  }

  // ===== MONTHLY =====
  if (mainChoice === "monthly") {
    let baseYear = window.moment().year();
    if (ctxFM.year) {
      const y = window.moment(ctxFM.year, "YYYY-MM-DD");
      if (y.isValid()) baseYear = y.year();
    }
    let labels = [], values = [];

    if (ctxFM.month) {
      const m0 = window.moment(ctxFM.month, "YYYY-MM-DD").startOf("month");
      [m0.clone().add(-1,"month"), m0.clone(), m0.clone().add(1,"month")].forEach(m => {
        labels.push(m.format("MMM YYYY"));
        values.push(m.format("YYYY-MM-01"));
      });
    } else if (ctxFM.year) {
      for (let m = 0; m < 12; m++) {
        const d = window.moment().year(baseYear).month(m).startOf("month");
        labels.push(d.format("MMM YYYY"));
        values.push(d.format("YYYY-MM-01"));
      }
    } else {
      const start = window.moment().startOf("month");
      for (let i = 0; i < 12; i++) {
        const d = start.clone().add(i, "month");
        labels.push(d.format("MMM YYYY"));
        values.push(d.format("YYYY-MM-01"));
      }
    }
    const pick = await qa.suggester(labels, values);
    if (!pick) return;

    await setFM((fm) => { fm.mplan = pick; });
    new Notice(Monthly plan → ${window.moment(pick).format("MMM YYYY")});
    return;
  }

  // ===== YEARLY =====
  if (mainChoice === "yearly") {
    let baseYear = window.moment().year();
    if (ctxFM.year) {
      const y = window.moment(ctxFM.year, "YYYY-MM-DD");
      if (y.isValid()) baseYear = y.year();
    }
    const years  = [baseYear - 1, baseYear, baseYear + 1, baseYear + 2];
    const labels = years.map(y => ${y});
    const values = years.map(y => ${y}-01-01);
    const pick = await qa.suggester(labels, values);
    if (!pick) return;

    await setFM((fm) => { fm.yplan = pick; });
    new Notice(Yearly plan → ${window.moment(pick).format("YYYY")});
    return;
  }

  // ===== DUE =====
  if (mainChoice === "due") {
    const today = window.moment().startOf("day");
    const labels = [], values = [];
    for (let i = 0; i < 30; i++) {
      const d = today.clone().add(i, "day");
      const prefix = (d.isoWeekday() === 1) ? `W${d.isoWeek()} • ` : "   ";
      labels.push(${prefix}${fmt(d, "ddd, DD MMM YYYY")});
      values.push(fmt(d, "YYYY-MM-DD"));
    }
    const pick = await qa.suggester(labels, values);
    if (!pick) return;

    await setFM((fm) => { fm.due = pick; });
    new Notice(Due date → ${window.moment(pick).format("ddd, DD MMM YYYY")});
    return;
  }

  // ===== PRIORITY (lowercase) =====
  if (mainChoice === "priority") {
    const pLabels = ["🔴 high", "🟡 medium", "🟢 low", "❌ clear"];
    const pValues = ["high", "medium", "low", null];
    const pick = await qa.suggester(pLabels, pValues);
    if (pick === undefined) return;

    await setFM((fm) => { if (pick) fm.priority = pick; else delete fm.priority; });
    new Notice(Priority ${pick ? "set to " + pick : "cleared"});
    return;
  }

  // ===== CLEAR PLANNING DATES (keep slot/priority) =====
  if (mainChoice === "cleardates") {
    await setFM((fm) => {
      delete fm.due;
      delete fm.dplan;
      delete fm.wplan;
      delete fm.mplan;
      delete fm.yplan;
    });
    new Notice("🧹 Cleared planning dates (due/dplan/wplan/mplan/yplan)");
    return;
  }

  // ===== ARCHIVE NOTE =====
  if (mainChoice === "archive") {
    const today = window.moment().format("YYYY-MM-DD");
    await setFM((fm) => { fm.archived = today; });
    const targetPath = await moveWithCollisionSafeName(ARCHIVE_DIR, file);
    new Notice(📦 Archived → ${targetPath});
    return;
  }
};