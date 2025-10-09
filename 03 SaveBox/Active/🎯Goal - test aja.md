---
priority: High
status: Active
create date: 2025-10-05
due:
---

My tags (Start with # and a letter):
#Y2025 

> [!success] My Goal 
> - [ ] 🎯Goal - test aja
>
> - Tick when done.
> - ⚠️ Keep only one goal here, go to Area page to add another.

### 🏁Start Here
- [ ] 2025-10-09 ^2025-10-09
> [!tip] Step 1: 🚀Create projects
> - Define the projects that help to realize this goal.
> - Think milestones, use verb, measurable, time bound.
> - Examples: “Set up a saving vault this week”, “Save $250 each month”, “Build an expense tracker this week”.

### Type your projects here👇
Hint: Create links to your project pages using prefix `Project - `
[[Project - Example1]]
[[🚀Project - testaja1]]


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

> [!info] Backlinks
> ```dataview
> LIST
> FROM ""
> WHERE contains(file.outlinks, this.file.link)
> SORT file.name ASC
> ```

