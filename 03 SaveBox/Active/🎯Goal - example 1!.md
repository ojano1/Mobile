---
priority: High
status: Active
create date: 2025-10-04
due:
---
Tags (start with # and a letter): #Y2025 
''
> [!success] My Goal 👇
> - [ ] 🎯Goal - example 1
> - Tick when done.
> - ⚠️ Keep only one goal here, go to Area page to add another.

### Next, follow these steps👇
- [ ] 2025-10-09 ^2025-10-09
> [!tip] Step 1: 🚀Create projects
> - Define the projects that lead to this goal.
> - Use verb, measurable, time bound.
> - Examples: “Set up a saving vault this week”, “Save $250 each month”, “Build an expense tracker this week”.

### Type new projects here👇
Use prefix `Project - `
[[Project - Example1]]
[[🚀Project - my 1]]



> [!tip] Step 2: Work from the Project page
> - Open each project note.
> - Create tasks **in the project page**.

### Projects linked to this goals👇
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
> [!tip] Step 3: ✅(Optional) Create done criteria
> - Outcome, amount, or result
> - Deadline
> - How you will verify

#### Done Criteria👇
''
### ✍️Comments
''
___

### Links
⚠️Add Area links here if missing in backlinks below to avoid orphan goals.

### Goal done criteria
- Outcome, amount, or result
- Deadline
- How you will verify

> [!info] Backlinks
> ```dataview
> LIST
> FROM ""
> WHERE contains(file.outlinks, this.file.link)
> SORT file.name ASC
> ```

