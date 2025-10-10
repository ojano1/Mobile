<%*
/*
 * Goal Template — keep local title logic
 * Result checkbox: "🎯Goal - <text after last dash in title>"
 */

const PREFIX = "🎯Goal - "
const title  = (tp.file.title ?? "").trim()

// Get text after the last "-"
// If no "-", strip any leading symbols and "goal"
let core = title.includes("-")
  ? title.split("-").pop().trim()
  : title.replace(/^[^A-Za-z0-9]+/, "").replace(/^\s*goal\b\s*/i, "").trim()

if (!core) core = "Untitled"

const created = tp.file.creation_date("YYYY-MM-DD")

const lines = [
  '---',
  'priority: High',
  'status: Active',
  `create date: ${created}`,
  'due: ',
  '---',
  '',
  'Add tags here (start with # and 1 letter):',
  '',
  `> [!success] My Goal`,
  `> - [ ] ${PREFIX}${core}`,
  `>`,
  '',
]

tR = lines.join('\n')
%>
### 👷‍♂️Instructions:
> [!tip] Step 1: 🚀Create projects to realize this goal.
> - Think milestones, use verb, measurable amount, time duration (ideally 1 month max per project, split if needed).
> - Examples: “Set up a saving vault in 1 week”, “Save $250 each month”, “Build an expense tracker in 1 week”.
> - Create links to your project page using prefix `Project - `

### Type your projects here👇
[[Project - Example1]]
'
'
'
[[🧠Mind Map]]


> [!tip] Step 2: Work from the Project page
> - Open each project note.
> - Create tasks **in the project page**.

### All the projects linked to this goals:
~~~dataviewjs
const projects = dv.pages("")
  .where(p =>
    p.file.name.includes("Project") &&
    !p.file.folder.includes("Archive") &&
    !p.file.folder.includes("Template") &&
    (
      p.file.folder.startsWith("01 Definition") ||
      p.file.folder.startsWith("02 Execution") ||
      p.file.folder.startsWith("03 SaveBox/Active") ||
      p.file.folder.startsWith("04 Output")
    ) &&
    (
      dv.current().file.outlinks.includes(p.file.link) ||
      p.file.outlinks.includes(dv.current().file.link)
    )
  )
  .sort(p => p.file.name, "asc");

if (projects.length) {
  dv.list(projects.map(p => p.file.link));
} else {
  dv.paragraph("Start adding projects! 😊");
}
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

### 🔗➡️Links:
*Add Area links here if none in backlinks section.*
'
'
'
'
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
