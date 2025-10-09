<details>

<summary>Click to expand</summary>
| Date | Time | Category | SGD | Paid_By | Note |
|------|------|----------|--------|---------|------|
<!-- EXPENSES:APPEND-HERE -->

</details>
```dataviewjs
// Expenses dashboard with Date/Time split + currency prefix
// Expects a table like: | Date | Time | Category | SGD | Paid_By | Note |

try {
  const { DateTime } = dv.luxon;

  // --- display formats & currency ---
  const FORMAT_DATE = "ccc, dd LLL yy";   // e.g. "Wed, 01 Oct 25"
  const FORMAT_TIME = "h:mm a";           // e.g. "7:07 am"
  const CURRENCY    = "S$ ";              // prefix for totals

  const path = dv.current().file.path;
  const text = await dv.io.load(path);

  // get only table-looking lines (start with | and have enough pipes)
  const rows = text.split("\n")
    .filter(l => /^\s*\|/.test(l) && (l.match(/\|/g) || []).length >= 6);

  if (rows.length < 3) { dv.paragraph("⚠️ No expense table found."); return; }

  // headers
  const headers = rows[0].split("|").map(s => s.trim()).filter(Boolean).map(h => h.toLowerCase());
  const body    = rows.slice(2);

  // helper to resolve flexible column names
  const findKey = (...cands) => cands.find(k => headers.includes(k));

  const DATE_K = findKey("date") ?? "date";
  const TIME_K = findKey("time", "timestamp", "when", "clock");
  const CAT_K  = findKey("category", "cat") ?? "category";
  const AMT_K  = findKey("sgd", "amount") ?? "sgd";
  const PAID_K = findKey("paid_by", "paid by", "paidby") ?? "paid_by";
  const NOTE_K = findKey("note", "notes", "desc") ?? "note";

  const parseAmount = v => Number(String(v).replace(/[^\d.]/g, "")) || 0;

  // parse "Date" + (optional) "Time" into Luxon DateTime
  const parseDateTime = (dStr, tStr) => {
    if (!dStr) return null;

    // try ISO first
    let dt = DateTime.fromISO(dStr);
    if (!dt.isValid) {
      // friendly date formats we allow (your QuickAdd output)
      const patterns = ["ccc, dd LLL yy", "ccc, d LLL yy"];
      for (const p of patterns) {
        dt = DateTime.fromFormat(dStr, p);
        if (dt.isValid) break;
      }
    }
    if (!dt.isValid) return null;

    // if there is a time string, try to apply it
    if (tStr) {
      const tt = DateTime.fromFormat(tStr, "h:mm a");
      if (tt.isValid) dt = dt.set({ hour: tt.hour, minute: tt.minute });
    }
    return dt;
  };

  // map body lines → objects
  const data = body.map(line => {
    const cells = line
      .split("|")
      .map(s => s.trim())
      .filter((_, i, arr) => !(i === 0 && arr[i] === "")); // drop leading blank

    const row = {};
    headers.forEach((h, i) => row[h] = cells[i] ?? "");

    const dStr = String(row[DATE_K] || "");
    const tStr = TIME_K ? String(row[TIME_K] || "") : "";
    const dt   = parseDateTime(dStr, tStr);

    return {
      dt,
      dStr,
      tStr,
      category: String(row[CAT_K] || "").replace(/^category:/i, "").trim(),
      amount:   parseAmount(row[AMT_K]),
      paidBy:   String(row[PAID_K] || ""),
      note:     String(row[NOTE_K] || "")
    };
  }).filter(r => r.dt && r.dt.isValid);

  // filter to current month
  const now = DateTime.local();
  const monthData = data.filter(r => r.dt.hasSame(now, "month"));

  // ===== Detail table (Date + Time in separate columns) =====
  const detailRows = monthData
    .sort((a,b) => a.dt - b.dt)
    .map(r => [
      r.dt.toFormat(FORMAT_DATE),
      r.dt.toFormat(FORMAT_TIME),
      r.category || "(Uncategorised)",
      r.amount.toFixed(2),
      r.paidBy,
      r.note
    ]);

  dv.table(["Date","Time","Category","SGD","Paid_By","Note"], detailRows);

  // ===== Grand total =====
  const grand = monthData.reduce((s, r) => s + r.amount, 0);
  dv.header(3, "💰 Total this month: " + CURRENCY + grand.toFixed(2));

  // ===== Category totals =====
  const byCat = {};
  for (const r of monthData) {
    const k = r.category || "(Uncategorised)";
    byCat[k] = (byCat[k] || 0) + r.amount;
  }
  const catRows = Object.entries(byCat)
    .sort((a,b) => b[1] - a[1])
    .map(([cat, total]) => [cat, CURRENCY + total.toFixed(2)]);

  dv.table(["Category","Total"], catRows);

} catch (e) {
  dv.paragraph("⚠️ Error: " + (e?.message || e));
}
```

