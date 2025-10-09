### ✏️My Note:
- [ ] 2025-10-09 ^2025-10-09
'
'
'
'



___
### 📫Notes Inbox 
~~~dataview
table floor((date(now) - file.ctime).days) as "Age(days)"
from "03 SaveBox/Active"
where contains(file.name, "Note") and endswith(file.name, "!")
sort file.name asc
~~~


___
### 🔗Backlinks
~~~dataviewjs
const backlinks = dv.pages()
  .where(p => p.file.outlinks && p.file.outlinks.some(link => link.path === dv.current().file.path))
  .sort(p => p.file.name, 'asc');

if (backlinks.length) {
  dv.list(backlinks.map(p => p.file.link));
} else {
  dv.paragraph("None");
}
~~~


### Scripts
~~~js

~~~
