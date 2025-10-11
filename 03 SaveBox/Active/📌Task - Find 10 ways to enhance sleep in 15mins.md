---
priority: Medium
status: Active
create date: 2025-10-10
due: 2025-10-11
duration_hours: "0.25"
done: true
---

Tags (start with # and a letter):

> [!success] My Task
> - [ ] 📌Task - Find 10 ways to enhance sleep in 15mins
>

### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add more details
> - Add description
> - Estimate hour duration in the property
> - Define the output of this task.

### ✍️Desriptions:
'Use AI to reaserch and make output note.
___

> [!tip] Step 2: Open each tasks to confirm it's created.

### All tasks linked to this project:
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

### ✅Done Criteria:
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

### 🔗➡️Links:
*Add project links here if there's none in backlinks*

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

