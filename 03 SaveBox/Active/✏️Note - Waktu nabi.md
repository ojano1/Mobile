### ✏️My Note:
'
'Nabi membagi waktunya jadi 3:
1. Buat keluarga
2. Buat ibadah
3. Buat dirinya



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
  .where(p =>
    p.file.outlinks &&
    p.file.outlinks.some(link => link.path === dv.current().file.path) &&
    !/Archive/i.test(p.file.folder) &&
    !/Template/i.test(p.file.folder)
  )
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
