// Scripts/habits_today.js
/**
 * Ensure today's checkbox exists in every habit file in a folder.
 * Line format: "- [ ] YYYY-MM-DD ^YYYY-MM-DD"
 * Prevents duplicates (by date/block id). Keeps existing [x] state.
 * newestFirst: true inserts near top (after "## Log" if present).
 *
 * Usage inside a template:
 * <%* await tp.user.habits_today({ folder: "Habits", newestFirst: true }) %>
 */
module.exports = async (params) => {
  const appRef = app;
  const folder = params?.folder ?? "Habits";
  const newestFirst = params?.newestFirst ?? true;

  const today = window.moment().format("YYYY-MM-DD");
  const blockId = `^${today}`;
  const todayLineRegex = new RegExp(`^- \\[([ xX])\\] ${today} \\^${today}$`, "m");
  const blockIdRegex = new RegExp(`\\^${today}(?:\\s|$)`);

  // collect habit files
  const files = appRef.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder + "/"));

  function insertAtPreferredSpot(content) {
    if (!newestFirst) return content.trimEnd() + "\n";
    const logHeader = /(^|\n)## +Log *\n/;
    const m = content.match(logHeader);
    if (m) {
      const idx = m.index + m[0].length;
      return content.slice(0, idx) + "- [ ] PLACEHOLDER\n" + content.slice(idx);
    }
    const firstHeading = content.match(/(^|\n)#+ .*\n/);
    if (firstHeading) {
      const idx = firstHeading.index + firstHeading[0].length;
      return content.slice(0, idx) + "- [ ] PLACEHOLDER\n" + content.slice(idx);
    }
    return "- [ ] PLACEHOLDER\n" + content;
  }

  for (const file of files) {
    let content = await appRef.vault.read(file);

    // already present?
    if (blockIdRegex.test(content) || todayLineRegex.test(content)) continue;

    const newLine = `- [ ] ${today} ${blockId}`;

    if (newestFirst) {
      let staged = insertAtPreferredSpot(content);
      staged = staged.replace("- [ ] PLACEHOLDER", newLine);
      await appRef.vault.modify(file, staged);
    } else {
      let trimmed = content.trimEnd();
      trimmed += (trimmed.endsWith("\n") ? "" : "\n") + `${newLine}\n`;
      await appRef.vault.modify(file, trimmed);
    }
  }
};
