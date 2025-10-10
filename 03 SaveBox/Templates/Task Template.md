<%*
/*
 * Task Template — adds unique block ID for two-way sync
 * Result checkbox: "📌Task - <core>" ^t-<timestamp>
 */

const PREFIX = "📌Task - ";
const title  = (tp.file.title ?? "").trim();
const created = tp.file.creation_date("YYYY-MM-DD");

// Extract text after last "-"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*task\b\s*/i, "").trim();
if (!core) core = "Untitled";

// Unique block ID (timestamp-based)
const uid = "t-" + moment().format("YYYYMMDD-HHmmss");

const lines = [
  "---",
  "priority: Medium",
  "status: Active",
  `create date: ${created}`,
  "due: ",
  "duration_hours: ",
  "---",
  "",
  "Tags (start with # and a letter):",
  "",
  `> [!success] My Task`,
  `> - [ ] ${PREFIX}${core} ^${uid}`,
  `>`,
  "",
];

tR = lines.join("\n");
%>
### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output

### ✍️Description  
''
___

### ✅Done Criteria  
''
___

### 🔗➡️Links:
*Add project links here if missing*

### 🔗⬅️Backlinks:
~~~dataviewjs
const backlinks = dv.pages()
  .where(p =>
    p.file.outlinks &&
    p.file.outlinks.some(link => link.path === dv.current().file.path) &&
    !/template/i.test(p.file.folder) &&
    !/archive/i.test(p.file.folder)
  )
  .sort(p => p.file.name, 'asc');

if (backlinks.length) dv.list(backlinks.map(p => p.file.link));
else dv.paragraph("None");
~~~