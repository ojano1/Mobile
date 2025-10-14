---
created: 14 Oct 2025
---
#### ✍️Just write it!
- Dari bani israil, sebelum nabi Daud.
Ujian nabi Ilyas 
Sulaiman dan Daud adLah rajA. Aetelah wafatnya nb Sulaiman mereka kembali menyembah patung berhala.
Nabi Ilyas tugasnya adalah berdakwah kepada mereka.
Seorang raja ingin membunuh nabi Ilyas, mendapat wahyu untuk lari bersembunyi di gua selama 40 hari/tahun
Nani dapat makan minum dari sekitaran lembah. Tiap hari ada burung gagak memberi buah2an di depan gua.
Seorang wanita datang ke datang tidak tau ada nabi. Ia sedang minta bantuan anaknya yg sakit. Nabi Ilyas pun merawat anaknya. Lalu sembuh. Mukjizstnya adalah menyembuhkan penyakit. Akhirnya bisa keluar gua dan bertemu penduduk.
Raja zolim sudah meninggal dunia. Lalu dakwah lg.
Moral: kita harus selalu berbaik sangka dengan Allah yakin dengan pertolongannya.
Di Quran nabi Ilyas terus sampaikan dakwah. 



___
#### 🔗Links:
-
~~~dataviewjs
// 📅 Daily + Mind Map on top, then linked/backlink notes (A–Z)
// For Task/Project/Goal: show Done / Not Done instead of date

const M = window.moment;
const todayStr = M().format("DD MMM YYYY");
const cur = dv.current().file ?? {};
const curPath = cur.path ?? "";

// --- Top lines ---
const todays = dv.pages().where(p =>
  p.file &&
  !/Archive|Templates/i.test(p.file.folder || "") &&
  (p.file.name || "").includes(todayStr)
);
const daily = todays.length ? todays[0].file.link : "None";
dv.el("div", `📅 ${daily} • Today's daily note`, { cls: "note-line" });
dv.el("div", `[[🧠Mind Map]] • Bird's-eye view`, { cls: "note-line" });

// --- Helpers ---
const normalizeLinks = links =>
  (links ?? []).map(l => typeof l === "string" ? l : l?.path).filter(Boolean);

const createdOf = p => {
  if (p?.created) {
    const m = M(p.created, ["DD MMM YYYY", "YYYY-MM-DD"], true);
    if (m.isValid()) return m;
  }
  return M(p?.file?.ctime);
};

const isTPG = name => /(Task|Project|Goal)/i.test(name || "");
const isDone = p => {
  if (typeof p?.done === "boolean") return p.done;
  const tasks = p?.file?.tasks ?? [];
  return tasks.length ? tasks.every(t => t.completed) : false;
};

// --- Collect linked + backlinks ---
const curOut = new Set(normalizeLinks(cur.outlinks));

const base = dv.pages().where(p => {
  const f = p?.file;
  if (!f) return false;
  const folder = f.folder ?? "";
  const name = f.name ?? "";
  if (/Archive|Templates/i.test(folder)) return false;
  if (!/(note|task|project|goal)/i.test(name)) return false;
  if (name.includes("!")) return false;
  if (f.path === curPath) return false;
  return true;
});

// outlinks to or from current
const linked = base
  .where(p => {
    const path = p.file.path;
    const pOut = normalizeLinks(p.file.outlinks);
    return pOut.includes(curPath) || curOut.has(path);
  })
  .array();

// backlinks from anywhere
const backlinks = dv.pages()
  .where(p =>
    p.file?.outlinks?.some(l => l.path === curPath) &&
    !/Archive|Templates/i.test(p.file.folder || "")
  )
  .array();

// unique, sort A–Z by name
const unique = Array.from(new Map([...linked, ...backlinks].map(p => [p.file.path, p])).values())
  .sort((a, b) => (a.file.name || "").localeCompare(b.file.name || "", undefined, { sensitivity: "base" }));

// --- Render if any ---
if (unique.length) {
  const items = unique.map(p => {
    const name = p.file.name || "";
    if (isTPG(name)) {
      return `${p.file.link} • ${isDone(p) ? "Done" : "Not Done"}`;
    } else {
      return `${p.file.link} • ${createdOf(p).format("DD MMM YYYY")}`;
    }
  });
  dv.el("div", items.join("<br>"), { cls: "note-list" });
}

// --- Styles (balanced) ---
const style = document.createElement("style");
style.textContent = `
.note-line { margin: 3px 0 !important; padding: 0 !important; line-height: 1.4; }
.note-list { margin-top: 6px !important; padding: 0 !important; line-height: 1.4; }
.note-list br { line-height: 1.4; }
`;
dv.container.append(style);
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
<p align="center">Template created by Akhmad Fauzan<br>©️All rights reserved</p>

