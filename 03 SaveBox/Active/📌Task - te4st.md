---
priority: Medium
status: Active
create date: 2025-10-11
due: 2025-10-11
duration_hours:
done: true
tags:
  - due-today
  - Oct
---

Tags (start with # and a letter):

> [!success] My Task
 - [ ] 📌Task - te4st 📅 ^t-20251011-095319
>
-
### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output

### ✍️Description  

___

### ✅Done Criteria  
''
___

### 🔗➡️Links:
*Add project links here if missing*
[[🚀Project - Research healthy presleep rituals in 1wk]]

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

if (backlinks.length) dv.list(backlinks.map(p => p.file.link));
else dv.paragraph("None");
~~~
