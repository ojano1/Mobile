<%*
/*
 * Project Template — hard-prefix + title-after-dash
 * Result checkbox: "🚀Project - <text after last dash in title>"
 */

const PREFIX = "🚀Project - "
const title  = (tp.file.title ?? "").trim()

// Get text after the last "-"
// If no "-", strip any leading symbols and "project"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*project\b\s*/i, "").trim()

if (!core) core = "Untitled"

const created = tp.file.creation_date("YYYY-MM-DD")

const lines = [
  '---',
  'priority: Medium',
  'status: Active',
  `create date: ${created}`,
  'due: ',
  '---',
  '',
  'Tags (start with # and a letter):',
'',
`> [!success] My Project`,
`> - [ ] ${PREFIX}${core}`,
`>`,
`> - Tick when done.`,
`> - ⚠️ Keep only one project here, go to Goal page to add another. `,
``,
]

tR = lines.join('\n')
%>
### 🏁Start Here
> [!tip] Step 1: 📌Create tasks  
> - Break into clear actions.  
> - Use verb, measurable, time bound.  
> - Examples: “Draft spec 1 page by Fri”, “Email vendor shortlist”, “Set review meeting Tue 3pm”.

#### Type your tasks here👇  
Hint: Create links to your task pages using prefix: `Task - `  
[[Task - example]]

> [!tip] Step 2: Open task pages and confirm creation.
### Tasks linked to this project👇
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

#### Done Criteria 👇
''
### ✍️Comments
''
___
### Links  
⚠️Add goal links here if missing in backlinks below to avoid orphan project.  


> [!info] Backlinks  
> ```dataview
> LIST
> FROM ""
> WHERE contains(file.outlinks, this.file.link)
> SORT file.name ASC
> ```

