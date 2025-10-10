---
priority: Medium
status: Active
create date: 2025-10-10
due:
---

Tags (start with # and a letter):

> [!success] My Project
> - [ ] 🚀Project - Research healthy presleep rituals in 1wk
### 👷‍♂️Instructions:
> [!tip] Step 1: 📌Create tasks  
> - Use verb, measurable, time unit (ideally 1 hour max per task, split if needed).
> - Examples: “Draft spec 1 page in 1 hour”, “Email vendor shortlist in 30mins”, “Set review meeting for Tue in 15mins”.
> - Create links to your task pages using prefix `Task - `  

#### Type your tasks here👇  
[[Task - example]]
'[[📌Task - Find 10 causes of sleep lack in 15mins]]
'[[📌Task - Find 10 ways to enhance sleep in 15mins]]
'[[Task Find 10 sunnah about sleep in 15mins]]
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
#### ✍️Comments:
'
'
'
'
___
#### 🔗➡️Links  :
*Add goal links here if missing in the backlinks.*


#### 🔗⬅️Backlinks:
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


