<%*
/*
 Project Template
 - Uses router rename ("🚀Project - <core>")
 - Adds `done` property (false by default)
 - Single main checkbox under “My Project” callout
*/

const PREFIX  = "🚀Project - ";
const title   = (tp.file.title ?? "").trim();
const created = tp.file.creation_date("YYYY-MM-DD");

// Extract text after last "-"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*project\b\s*/i, "").trim();
if (!core) core = "Untitled";

const lines = [
  "---",
  "priority: Medium",         // High | Medium | Low
  "status: Active",           // Active | On Hold | Done
  `created: ${created}`,
  "due: ",                    // fill later
  "done: false",              // editable checkbox property
  "tags: []",                 // YAML array
  "---",
  "",
  "### My Project",
  `- [ ] ${PREFIX}${core}`,
  "",
];

tR = lines.join("\n");
%>

### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
'
'
'
[[🧠Mind Map]]
> [!tip] Step 2: Open task pages and confirm creation.
#### All tasks linked to this project:
~~~dataview
LIST
FROM ""
WHERE contains(file.name, "Task")
AND (
  startswith(file.folder, "01 Definition")
  OR startswith(file.folder, "02 Execution")
  OR startswith(file.folder, "03 SaveBox/Active")
  OR startswith(file.folder, "04 Output")
)
AND (
  contains(this.file.outlinks, file.link)
  OR contains(file.outlinks, this.file.link)
)
SORT file.name ASC
~~~
> [!tip] Step 3: ✅(Optional) Create done criteria
> - Outcome, amount, or result
> - Deadline
> - How you will verify

#### ✅Done Criteria:
'
'
'
'
___
### ✍️Comments:
'
'
'
'
___
### 🔗➡️Links  :
*Add goal links here if missing in the backlinks*

___
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

if (backlinks.length) {
  dv.list(backlinks.map(p => p.file.link));
} else {
  dv.paragraph("None");
}
~~~

