---
priority: High
status: Active
create date: <% tp.file.creation_date("YYYY-MM-DD") %>
---

> [!tip] Step 1: 🎯Set one clear goal
> *Start a new one only after you've cempleted it*
> - Use verb, measurable, time unit.
> - Examples: “Save $3,000 this year”, “Lose 5 kg this month”.


### My goal👇
Hint: Create a link to your goal page using prefix: `Goal - `
[[Goal - Example]]
'
'
[[🧠Mind Map]]

> [!tip] Step 2: Work from the goal page
> - Open the goal note above.
> - Create projects **in the goal page**.

### ✍️Comments:
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
