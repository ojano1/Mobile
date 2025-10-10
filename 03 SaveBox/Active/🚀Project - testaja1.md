---
priority: Medium
status: Active
create date: 2025-10-05
due:
---

My tags (Start with # and a letter):

> [!success] My Project
> - [x] 🚀Project - testaja1
>
> - Tick when done.
> - ⚠️ Keep only one project here, go to Goal page to add another. 

### 🏁Start Here
- [ ] 2025-10-09 ^2025-10-09
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


