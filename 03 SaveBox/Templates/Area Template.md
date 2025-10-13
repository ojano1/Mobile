---
priority: Medium
status: Active
created: <% tp.file.creation_date("YYYY-MM-DD") %>
---

>[!tip] Step 1️⃣: Make one wish in this area that would make you happy.
>- Ask yourself: What makes me happy with my (area) is if I have/can do...
>- *Start a with one wish first to build momentum*
#### My wishes👇
*Example: What makes me happy with my health is if I can wake up feeling fresh everyday.*
- 

___
>[!tip] Step 2️⃣: Set a clear 🎯goal that makes it almost impossible for your wish not to come true. 
>*You can’t control God, but you can work to tilt the odds in your favor.*
> - Use verb, measurable amount, time duration.
> - Examples: “Save $3,000 this year”, “Lose 5 kg this month”.
> - Create a link to your goal page using prefix `Goal - `
>- *Start a with one goal first to build momentum*
### My goals👇
[[Goal - Example]]
- 
___
See the [[🧠Mind Map]] for a bird’s-eye view of your life.
> [!tip] Step 3️⃣: Work from the goal page
> - Open your goal notes and create projects there.

### ✍️Comments:
•
•
•
___
### 🔗➡️Links:
•
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
___
<p align="center">Template created by Akhmad Fauzan. <br>©️All rights reserved</p>
