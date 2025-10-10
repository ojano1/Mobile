---
priority: Medium
status: Active
create date: 2025-10-10
due:
---

Tags (start with # and a letter):

> [!success] My Project
> - [ ] 🚀Project - Research healthy presleep rituals in 1wk
>
> - Tick when done.
> - ⚠️ Keep only one project here, go to Goal page to add another. 

### 🏁Start Here
> [!tip] Step 1: 📌Create tasks  
> - Break into clear actions.  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.

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
### Links  :
⚠️Add goal links here if missing in backlinks below to avoid orphan project.  


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


