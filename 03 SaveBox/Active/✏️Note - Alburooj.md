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

