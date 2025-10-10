---
priority: High
status: Active
create date: 2025-10-10
---

> [!tip] Step 1: 🎯Set one clear goal
> - Use verb, measurable, time bound.
> - Examples: “Save $3,000 this year”, “Run a 5K by March”, “Lose 5 kg this month”.


### My goal👇
Hint: Create a link to your goal page using prefix: `Goal - `
[[Goal - Example]]

> [!tip] Step 2: Work from the goal page
> - Open the goal note above.
> - Create projects **in the goal page**.

### ✍️Comments:
___
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


