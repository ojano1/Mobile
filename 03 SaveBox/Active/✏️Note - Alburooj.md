---
created: 13 Oct 2025
---
#### ✍️Just write it!
• Tentang penindasan muayrikin terjadanp mukmin di Mekah
• Allah ingatkan tentang Firaun, dan kaum yg menentang Allah
- Allah bersimpah terhadap sesuatu berarti point penting.
- Bersumpah dengan langit yang mempunyai bintang2 12. Langit disebut 120x dlm Quran
- Ayat 1 Perhatikan langit menembus galaksi dan cakrawala, sementara waktunitu belum diketahui apa detail langit dibalik kasat mata dari bumi.
- sebagai bahan renungan untuk memperkuat iman, terdapat kebesaran Allah
- ayat 2 Allah bersumpah dengan hari kiamat. Semua itu akan dimusnahkan. Semua ciptaan Allah adalah untuk manfaat manusia.
- Fungsi manusia -> beribadah pada Allah
- ayat 3: Allah bersumpah dengan orang yg menyaksikan dan yg disaksikan
- Yg menyaksikan: hari jumat, yng disaksikan hari arafah. Hari arah kita menyaksikan 1x setahun umat muslim seluruh dunia berkumpul 9 zulhijah.
- Hari jumat menyaksikan orang shalat jumat
- tafsir kedua: Rasulullah menjadi saksi kita beriman di akhirat, yg disaksikan adalah umat manusia
- 


___
#### 🔗➡️Frequently used links
~~~dataviewjs
// 📅 Show today's daily note and Mind Map link

const M = window.moment;
const todayStr = M().format("DD MMM YYYY");

const pages = dv.pages().where(p =>
  p.file &&
  !/Archive|Templates/i.test(p.file.folder || "") &&
  (p.file.name || "").includes(todayStr)
);

if (!pages.length) {
  dv.paragraph(`📅 None found • Today's daily note`);
} else {
  const link = pages[0].file.link;
  dv.paragraph(`📅 ${link} • Today's daily note`);
}

dv.paragraph(`[[🧠Mind Map]] • Bird's-eye view`);
~~~
___
#### 📫Notes Inbox 
*Remove "!" to release*
~~~dataviewjs
// 📂 Notes Inbox (age only)
// Includes only filenames containing "Note" and "!"

const M = window.moment;

// helper: get created moment from YAML `created` or file.ctime
const createdOf = (p) => {
  if (p.created) {
    const m = M(p.created, ["DD MMM YYYY", "YYYY-MM-DD"], true);
    if (m.isValid()) return m;
  }
  return M(p.file.ctime);
};

// --- filters ---
const pages = dv.pages().where(p =>
  p.file &&
  !/Archive|Templates/i.test(p.file.folder || "") &&
  /note/i.test(p.file.name || "") &&
  /!/.test(p.file.name || "")
);

// --- sort oldest → newest ---
const list = pages.array().sort((a, b) => createdOf(a).valueOf() - createdOf(b).valueOf());

if (!list.length) {
  dv.el("p", "No notes found.");
} else {
  const today = M().startOf("day");

  const lines = list.map(p => {
    const created = createdOf(p).startOf("day");
    const days = today.diff(created, "days");
    const ageLabel = days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`;
    return `- ${p.file.link} • ${ageLabel}`;
  });

  const wrap = dv.el("div", lines.join("\n"), { cls: "note-list" });

  const style = document.createElement("style");
  style.textContent = `
    .note-list {
      margin-top: 0 !important;
      padding-top: 0 !important;
      line-height: 1.5;
    }
    .note-list p, .note-list ul, .note-list div {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  `;
  wrap.appendChild(style);
}

~~~



___
#### 🔗⬅️Backlinks
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

