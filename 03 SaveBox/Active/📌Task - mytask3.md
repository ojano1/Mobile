---
priority: Medium
status: Active
create date: 2025-10-05
due: 2025-10-05
duration_hours: "1"
---

Tags (start with # and a letter):
#OCT 
> [!success] My Task
> - [ ] 📌Task - mytask3
>
> - Tick when done.
> - ⚠️ Keep only one task here, go to Project page to add another.

### 🏁Start Here
- [ ] 2025-10-09 ^2025-10-09
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

#### Done Criteria 👇
''
### ✍️Comments  
''
___

### Links  
⚠️Add project links here if missing in backlinks below to avoid orphan tasks.  

> [!info] Backlinks  
> ```dataview
> LIST
> FROM ""
> WHERE contains(file.outlinks, this.file.link)
> SORT file.name ASC
> ```

