<%*
/*
 * Task Template — hard-prefix + title-after-dash
 * Result checkbox: "📌Task - <text after last dash in title>"
 */

const PREFIX = "📌Task - "
const title  = (tp.file.title ?? "").trim()

// Get text after the last "-"
// If no "-", strip leading symbols and "task"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*task\b\s*/i, "").trim()

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
  `> [!success] My Task`,
  `> - [ ] ${PREFIX}${core}`,
  `>`,
  `> - Tick when done.`,
  `> - ⚠️ Keep only one task here, go to Project page to add another.`,
  ``,
]

tR = lines.join('\n')
%>
### 🏁Start Here
> [!tip] Step 1: ✍️Add notes or sub-actions  
> - Define what completion means.  
> - Capture constraints or dependencies.  
> - Keep it measurable and time bound.  

#### ✍️Notes  
''
___

> [!tip] Step 2: Open each tasks to confirm it's created.

### All confirmed tasks in this project👇
~~~dataview
LIST
FROM ""
WHERE contains(file.name, "Project")
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

> [!tip] Step 3: ✅(Optional) Define done criteria  
> - Outcome, amount, or result  
> - Deadline  
> - How you will verify  

#### Done Criteria:
'
'
'
'
### ✍️Comments:
'
'
'
'
___

### Links:
⚠️Add project links here if missing in backlinks below to avoid orphan tasks.  

### 🔗Backlinks:
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
