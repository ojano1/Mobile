---
priority: Medium
status: Active
create date: 2025-10-10
due:
duration_hours:
---

Tags (start with # and a letter):

> [!success] My Task
> - [ ] 📌Task - tes trasclucen ^t-20251010-220337
>

### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output

### ✍️Description  
''
___

### ✅Done Criteria  
''
___

### 🔗➡️Links:
*Add project links here if missing*

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
