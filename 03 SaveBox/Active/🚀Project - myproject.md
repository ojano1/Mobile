---
priority: Medium
status: Active
create date: 2025-10-04
due: 2025-10-12
done: true
_project_sync_state: true
duration_hours: "1"
---
Tags (start with # and a letter): #Q4 
### My Project
- [x] 🚀Project - myproject

### Next, follow these steps👇
- [ ] 2025-10-09 ^2025-10-09
> [!tip] Step 1: 📌Create tasks  
> - Break into clear actions.  
> - Use verb, measurable, time bound.  
> - Examples: “Draft spec 1 page by Fri”, “Email vendor shortlist”, “Set review meeting Tue 3pm”.

#### Type your tasks here👇  
Hint: Use prefix `Task - `  
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


