// scripts/monthly-expenses.js
// QuickAdd user script: create/open the monthly expenses note and append a row.
//
// HOW IT WORKS
// 1) It figures out the current month note name like "Oct 2025.md" and
//    ensures the file exists in _01 Journal/Monthly (optionally from a template).
// 2) It prompts you for Category, Amount (SGD), Paid By, and Note.
// 3) It appends a markdown table row AFTER the marker:
//      <!-- EXPENSES:APPEND-HERE -->
//
// You can safely run this from mobile. No external libs required.

module.exports = async (params) => {
  const { app, quickAddApi } = params;

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const MONTHLY_DIR     = "_01 Journal/Monthly";               // target folder
  const TEMPLATE_PATH   = "Templates/Monthly Expense Template"; // optional
  const APPEND_MARKER   = "<!-- EXPENSES:APPEND-HERE -->";     // must exist in file

  // Optional “pick lists”:
  const CATEGORY_LIST_FILE = "Scripts/Expenses categories.md";
  const PAIDBY_LIST_FILE   = "Scripts/Payment method.md";

  // Date/time display like: "Wed, 01 Oct 25" and "7:07 am"
  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "2-digit"
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric", minute: "2-digit", hour12: true
  });

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const readFileIfExists = async (path) => {
    const f = app.vault.getAbstractFileByPath(path);
    return f ? await app.vault.read(f) : null;
  };

  const ensureFolder = async (folder) => {
    if (!app.vault.getAbstractFileByPath(folder)) {
      await app.vault.createFolder(folder);
    }
  };

  const monthFileName = (d = new Date()) => {
    const m = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
    const y = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(d);
    return `${m} ${y}.md`; // e.g., "Oct 2025.md"
  };

  const loadOptionsFromFile = async (path) => {
    const txt = await readFileIfExists(path);
    if (!txt) return [];
    // Take non-empty lines that are not headings, tables, or comments
    return txt
      .split("\n")
      .map(s => s.trim())
      .filter(s =>
        s &&
        !s.startsWith("|") &&
        !s.startsWith("#") &&
        !s.startsWith(">") &&
        !s.startsWith("```")
      );
  };

  const promptCategory = async () => {
    const options = await loadOptionsFromFile(CATEGORY_LIST_FILE);
    if (options.length) {
      return await quickAddApi.suggester(options, options);
    }
    return await quickAddApi.inputPrompt("Category");
  };

  const promptPaidBy = async () => {
    const options = await loadOptionsFromFile(PAIDBY_LIST_FILE);
    if (options.length) {
      return await quickAddApi.suggester(options, options);
    }
    return await quickAddApi.inputPrompt("Paid by");
  };

  const parseAmount = (s) => {
    const n = Number(String(s).replace(/[^\d.]/g, ""));
    return isFinite(n) ? n : 0;
  };

  const buildRow = ({ dateStr, timeStr, category, amount, paidBy, note }) =>
    `| ${dateStr} | ${timeStr} | ${category} | ${amount} | ${paidBy} | ${note || ""} |`;

  // If monthly file doesn’t exist, create it (from template if present, else minimal)
  const ensureMonthlyFile = async (path) => {
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing) return existing;

    await ensureFolder(MONTHLY_DIR);

    let content = await readFileIfExists(`${TEMPLATE_PATH}.md`);
    if (!content) {
      // Minimal fallback template with header row & marker (inside a details block to "hide" table)
      const now = new Date();
      const monthTitle = monthFileName(now).replace(".md", ""); // e.g. "Oct 2025"
      content =
`# 🧾 Expenses — ${monthTitle}

<details>
<summary>Raw table</summary>

| Date | Time | Category | SGD | Paid_By | Note |
|------|------|----------|-----|---------|------|
${APPEND_MARKER}

</details>

## 💰 Total this month: S$ 0.00

## Category (0) | Total
> Add your Dataview/DataviewJS summaries here if you like.
`;
    }
    return await app.vault.create(path, content);
  };

  const insertAfterMarker = (text, marker, insertText) => {
    const i = text.indexOf(marker);
    if (i === -1) {
      throw new Error(`Append marker not found: ${marker}`);
    }
    const before = text.slice(0, i + marker.length);
    const after  = text.slice(i + marker.length);
    // ensure a newline after the marker, then the row, then a newline
    const glue = before.endsWith("\n") ? "" : "\n";
    return `${before}${glue}${insertText}\n${after}`;
  };

  // ── MAIN ──────────────────────────────────────────────────────────────────
  // 1) Monthly file path
  const fileName = monthFileName(new Date());        // "Oct 2025.md"
  const monthlyPath = `${MONTHLY_DIR}/${fileName}`;

  // 2) Ensure monthly file exists
  const monthlyFile = await ensureMonthlyFile(monthlyPath);
  let fileText = await app.vault.read(monthlyFile);

  // 3) Prompts
  const category = await promptCategory();
  if (!category) { new Notice("Cancelled: Category required."); return; }

  const amountStr = await quickAddApi.inputPrompt("Amount (SGD)");
  const amount = parseAmount(amountStr);

  const paidBy = await promptPaidBy();
  if (!paidBy) { new Notice("Cancelled: Paid by required."); return; }

  const note = await quickAddApi.inputPrompt("Note (optional)") || "";

  // 4) Build row
  const now = new Date();
  const dateStr = dateFmt.format(now);                 // "Wed, 01 Oct 25"
  const timeStr = timeFmt.format(now).toLowerCase();   // "7:07 am"
  const row = buildRow({ dateStr, timeStr, category, amount, paidBy, note });

  // 5) Insert after marker and save
  try {
    const updated = insertAfterMarker(fileText, APPEND_MARKER, row);
    await app.vault.modify(monthlyFile, updated);
    new Notice(`Expense added to ${fileName}`);
  } catch (e) {
    console.error(e);
    new Notice(e.message || "Failed to insert expense row.");
  }
};