---
created: <% tp.file.creation_date("DD MMM YYYY") %>
---
<%*
// wait for file open, then fold editor
await new Promise(r => setTimeout(r, 200));
app.commands.executeCommandById('editor:fold-all');
%>

''





___
### 📫Notes Inbox 
~~~dataviewjs
// 📂 Notes Inbox (age only)
// Includes only filenames containing "Note"

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
  /note/i.test(p.file.name || "")
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
<%*
// wait for file open, then fold editor
await new Promise(r => setTimeout(r, 200));
app.commands.executeCommandById('editor:fold-all');
%>


___
### 🔗⬅️Backlinks
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
