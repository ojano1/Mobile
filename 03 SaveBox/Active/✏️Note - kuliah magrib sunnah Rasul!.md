
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

Nabi diluar rumah sangat menjaga lidahnya terhadap perkara yg 

Nabi kaidahnya mendekatkan bukn menjauhkan
Nabi memuliakan ketua umat, untuk tujuan dakwah supaya anak buahnya juga ikut.

Waktu diluar rumah:
Nabi memberi peringatan akan azab
Nabi tetap bermuka ceria
Cerita 3 munafik yg tidak ikut persng sambuk

Nabi selalu perhatikan orwng yang tidak nampak seperti biasanya

Orang yang paling concern dengan umat adalah yg paling dekat dengan nabi
Sebaik2 kalian adalah yg memberi manfaat kemasyarakat

Dimajlis2
Nani tidak akan duduk atau bangun sebelum menyebut nama Allah
Hadist: manusia akan menyesal ketika dia duduk tidak menyebut nama Allah
Doa kafaratul majlis
Subhanakallah  warhamdika. waatubuilaik
Pengampunan dari bualan 

Nabi akan duduk di belakang jika sudah penuh
Adab: Jumat jangan langkah orang kecuali ada kosong tidak diisi.

Nabi menerima hajat orang sampai yg punya hajat pulang



___
### 🔗➡️Links

___
### 📫Inbox 
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

