
Sifat rendah diri Rasul (tawadhu)
Hadist 336
Anak tiri nabi Min dari siti khadijah

Rasullullah: orang yang paling dekat dengan aku di hari kiamat adalah orang yg paling baik akhlaknya.


Di rumah waktu nabi ada 3 bagian:
1. Untuk Allah (ibadah)
2. Untuk keluarganya
3. Untuk dirinya

Masauntuk dirinya:
1. Untuk dirinya
2. Untuk orang lain kaum muslimin


Hasan bertanya kepada pakciknya Min:



### 📫Notes Inbox 
- [ ] 2025-10-09 ^2025-10-09
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

