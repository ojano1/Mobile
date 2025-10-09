

<details>
<summary>Detail Transactions</summary>

| Date | Time | Category | SGD | Paid_By | Note |
|------|------|----------|-----|---------|------|
<!-- EXPENSES:APPEND-HERE -->
</details>

```dataviewjs
// show category totals
// === Expenses summary (grand + category totals) ===
// It parses the first markdown table in THIS file.
// Table headers expected: Date | Time | Category | SGD | Paid_By | Note

const path = dv.current().file.path;
const text = await dv.io.load(path);

// Grab only lines that look like a markdown table row (start with `|`)
const pipeLines = text.split("\n").filter(l => /^\s*\|/.test(l));

// Need header + separator + at least 1 row
if (pipeLines.length < 3) {
  dv.paragraph("⚠️ No expense table found.");
  return;
}

// Parse header
const headers = pipeLines[0]
  .split("|").map(s => s.trim()).filter(Boolean)
  .map(h => h.toLowerCase());

// Find column positions (case-insensitive)
const col = {
  date: headers.indexOf("date"),
  time: headers.indexOf("time"),
  category: headers.indexOf("category"),
  sgd: headers.indexOf("sgd"),
  paid_by: headers.indexOf("paid_by"),
  note: headers.indexOf("note"),
};

// Convert body lines → row objects
const body = pipeLines.slice(2); // skip header + separator
const rows = body.map(line => {
  const cells = line.split("|").map(s => s.trim()).filter(Boolean);
  return {
    date:      col.date      >= 0 ? cells[col.date]      : "",
    time:      col.time      >= 0 ? cells[col.time]      : "",
    category:  col.category  >= 0 ? cells[col.category]  : "",
    sgd:       col.sgd       >= 0 ? Number(String(cells[col.sgd]).replace(/[^\d.\-]/g,"")) || 0 : 0,
    paid_by:   col.paid_by   >= 0 ? cells[col.paid_by]   : "",
    note:      col.note      >= 0 ? cells[col.note]      : "",
  };
}).filter(r => r.sgd !== 0 || r.category || r.date); // keep non-empty rows

// Helpers
const money = n => `S$ ${n.toFixed(2)}`;

// GRAND TOTAL
const grand = rows.reduce((sum, r) => sum + (r.sgd || 0), 0);
dv.header(2, `💰 Total this month: ${money(grand)}`);

// CATEGORY TOTALS
const byCat = new Map();
for (const r of rows) {
  const key = r.category || "(Uncategorized)";
  byCat.set(key, (byCat.get(key) || 0) + (r.sgd || 0));
}

// Build table: Category | Total (S$)
const catRows = [...byCat.entries()]
  .sort((a,b) => b[1] - a[1])
  .map(([k,v]) => [k, money(v)]);

if (catRows.length) {
  dv.table(["Category", "Total"], catRows);
} else {
  dv.paragraph("_No category totals to show._");
}
```
```dataviewjs
// 🗓️ Total expenses by day (from the first markdown table in THIS file)

const { DateTime } = dv.luxon;
const path = dv.current().file.path;
const text = await dv.io.load(path);

// 1) Grab ONLY lines that look like markdown-table rows
const pipeLines = text.split("\n").filter(l => /^\s*\|/.test(l));
if (pipeLines.length < 3) { dv.paragraph("No expense table found."); return; }

// 2) Parse table
const headers = pipeLines[0]
  .split("|").map(s => s.trim()).filter(Boolean)
  .map(h => h.toLowerCase());          // ['date','time','category','sgd','paid_by','note']

const body = pipeLines.slice(2);       // skip header + separator

const rows = body.map(line => {
  const cells = line.split("|").map(s => s.trim())
    .filter((_, i, arr) => !(i === 0 && arr[i] === "")); // drop leading empty cell if present

  const obj = {};
  headers.forEach((h, i) => obj[h] = cells[i] ?? "");

  // Normalize amount
  obj.sgd = Number(String(obj.sgd).replace(/[^\d.]/g, "")) || 0;

  // Keep original date string, but also parse so we can sort
  obj.dateStr = obj.date || "";
  obj.dateLux = DateTime.fromFormat(obj.dateStr, "ccc, dd LLL yy", { locale: "en" });
  return obj;
}).filter(r => r.dateStr);

// 3) Group by day and sum
const byDay = new Map();
for (const r of rows) {
  const key = r.dateStr;
  const prev = byDay.get(key) ?? { dateStr: key, dateLux: r.dateLux, total: 0 };
  prev.total += r.sgd;
  byDay.set(key, prev);
}

// 4) Render table (sorted by date ascending)
const dayArr = [...byDay.values()]
  .sort((a,b) => a.dateLux - b.dateLux)
  .map(d => [d.dateStr, `S$ ${d.total.toFixed(2)}`]);

dv.table(["Date", "Total"], dayArr);
```