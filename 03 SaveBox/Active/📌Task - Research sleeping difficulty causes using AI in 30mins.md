---
_task_sync_state: false
done: false
created: 13 Oct 2025
status: Active
priority: Medium
due:
duration_hours:
tags: []
---

### My Task
- [ ] 📌Task - task Research sleeping difficulty causes using AI in 30mins


### 👷‍♂️Instructions:
> [!tip] Step 1: ✍️Add details  
> - Describe, set duration_hours  
> - Define expected output

### ✍️Description  
''
See the [[🧠Mind Map]] for a bird’s-eye view of your life.
___

### ✅Done Criteria  
''
___
### Notes linked to this task

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
