<%*
/*
 Task Template
 - Works with your router ("📌Task - <core>")
 - Reads the prefix from the filename
 - Adds a frontmatter `done` property (false by default)
 - One task per note, under "### My Task"
*/

const title   = (tp.file.title ?? "").trim();
const created = tp.file.creation_date("YYYY-MM-DD");

// Extract "<prefix>" and "<core>" from "<prefix><core>"
// Example title: "📌Task - Call Client"
const m = title.match(/^(.*?\bTask\s*-\s*)(.+)$/i);
const prefix = m ? m[1] : "📌Task - ";
const core   = (m ? m[2] : title).trim();

const lines = [
  "---",
  "_task_sync_state: false",
  "done: false",                // editable checkbox in Properties view 
`created: ${tp.file.creation_date("DD MMM YYYY")}`,

  "status: Active",             // Active | Archived
  "priority: Medium",           // High | Medium | Low
  "due: ",                      // fill later
  "duration_hours: ",           // number
  "tags: []",                   // YAML array
  "---",
  "### My Task",
  `- [ ] ${prefix}${core}`,
 "",
  "#### Description",
  "- ", // placeholder line for user to start typing description
  "---",
  "",
];
tR = lines.join("\n");
%>
> [!tip] Step 1️⃣: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output
___
See the [[🧠Mind Map]] for a bird’s-eye view of your life.
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