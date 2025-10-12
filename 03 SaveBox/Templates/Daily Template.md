### ✍️Fleet Notes

'
'
'
___
### 📌My tasks for today
~~~dataviewjs
(async () => {
  const host = dv.current().file.name;
  const m = window.moment(host, ["D MMM YYYY", "DD MMM YYYY", "YYYY-MM-DD"], true);
  if (!m.isValid()) { dv.paragraph("Filename needs a date like 11 Oct 2025 or 2025-10-11."); return; }
  const ISO = m.format("YYYY-MM-DD");

  const pages = dv.pages().where(p =>
    !/Templates|Archive/i.test(p.file.folder) &&
    !/[!]\s*$/.test(p.file.name) &&
    p.file.name.includes("Task")
  );

  const prRank = { High: 1, Medium: 2, Med: 2, Low: 3 };
  const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  function sectionText(src, name) {
    const re = new RegExp(`^#{1,6}\\s+${rx(name)}\\s*$`, "gim");
    const m = re.exec(src); if (!m) return null;
    const start = m.index + m[0].length;
    const level = (m[0].match(/^#+/) || ["#"])[0].length;
    const next = new RegExp(`^#{1,${level}}\\s+`, "gim"); next.lastIndex = start;
    const n = next.exec(src);
    return { text: src.slice(start, n ? n.index : src.length) };
  }
  function firstCheckbox(sec) {
    const re = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/m;
    const m = re.exec(sec.text); if (!m) return null;
    return { checked: /\[(x|X)\]/.test(m[0]) };
  }

  const rows = [];
  for (const p of pages) {
    let dueISO = null;
    if (p.due) {
      const mdue = window.moment(String(p.due), ["YYYY-MM-DD", "D MMM YYYY", window.moment.ISO_8601], true);
      if (mdue.isValid()) dueISO = mdue.format("YYYY-MM-DD");
    }
    if (dueISO !== ISO) continue;

    const file = app.vault.getAbstractFileByPath(p.file.path);
    if (!file) continue;
    const text = await app.vault.read(file);
    const sec = sectionText(text, "My Task");
    if (!sec) continue;
    const box = firstCheckbox(sec);
    if (!box) continue;

    const checked = typeof p.done === "boolean" ? p.done : box.checked;
    rows.push({
      path: p.file.path,
      name: p.file.name,
      checked,
      pri: p.priority ?? "",
      dur: toNum(p.duration_hours ?? 0),
      timeslot: (p.timeslot ?? "Anytime").trim()
    });
  }

  if (!rows.length) { dv.paragraph("This must be Sunday 🪁"); return; }

  const slotOrder = ["Morning", "Afternoon", "Evening", "Anytime"];
  const slotEmoji = { Morning: "🌅", Afternoon: "🌞", Evening: "🌙", Anytime: "🕒" };
  const slotDesc  = {
    Morning: "High impact work",
    Afternoon: "Admin work",
    Evening: "Review and tomorrow planning",
    Anytime: "Flexible tasks"
  };
  const groups = Object.fromEntries(slotOrder.map(s => [s, []]));
  for (const r of rows) groups[slotOrder.includes(r.timeslot) ? r.timeslot : "Anytime"].push(r);

  const wrap = document.createElement("div");
  wrap.style.display = "block";

  for (const slot of slotOrder) {
    const group = groups[slot];
    const hasItems = group.length > 0;

    const g = document.createElement("div");
    g.style.marginBottom = "16px";

    const header = document.createElement("div");
    header.style.fontWeight = "600";
    header.style.margin = "0";
    if (hasItems) {
      const count = group.length;
      const hours = group.reduce((a, b) => a + (b.dur || 0), 0);
      header.textContent =
        `${slotEmoji[slot]} ${slot} (${count} task${count > 1 ? "s" : ""} • ${hours} hr${hours === 1 ? "" : "s"})`;
    } else {
      header.textContent = `${slotEmoji[slot]} ${slot} (None)`;
    }
    g.appendChild(header);

    const subtitle = document.createElement("div");
    subtitle.style.opacity = "0.8";
    subtitle.style.fontStyle = "italic";
    subtitle.style.marginTop = "2px";
    subtitle.style.marginBottom = hasItems ? "4px" : "0";
    subtitle.textContent = slotDesc[slot] || "";
    g.appendChild(subtitle);

    if (hasItems) {
      group.sort((a, b) => {
        const ap = prRank[a.pri] ?? 9, bp = prRank[b.pri] ?? 9;
        return ap - bp || (a.dur ?? 0) - (b.dur ?? 0);
      });

      const listDiv = document.createElement("div");
      for (const r of group) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "auto 1fr";
        row.style.alignItems = "start";
        row.style.columnGap = "8px";
        row.style.rowGap = "0";
        row.style.padding = "2px 0";
        row.style.minWidth = "0";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = r.checked;
        cb.style.margin = "0";

        const content = document.createElement("div");
        content.style.minWidth = "0";
        content.style.lineHeight = "1.35";

        const link = document.createElement("a");
        link.textContent = r.name;
        link.href = "#";
        link.style.minWidth = "0";
        link.onclick = e => { e.preventDefault(); app.workspace.openLinkText(r.path, dv.current().file.path, false); };

        const meta = document.createElement("span");
        meta.style.opacity = "0.8";
        meta.style.marginLeft = "8px";
        const bits = [r.pri || "", `${r.dur} hr${r.dur === 1 ? "" : "s"}`].filter(Boolean);
        meta.textContent = bits.length ? "· " + bits.join(" · ") : "";

        const doneMark = document.createElement("span");
        doneMark.textContent = " ✅";
        doneMark.style.marginLeft = "6px";
        doneMark.style.display = r.checked ? "inline" : "none";

        content.append(link, meta, doneMark);
        row.append(cb, content);
        listDiv.appendChild(row);

        const applyDoneStyle = done => {
          link.style.textDecoration = done ? "line-through" : "none";
          meta.style.display = done ? "none" : "inline";
          doneMark.style.display = done ? "inline" : "none";
        };
        applyDoneStyle(r.checked);

        cb.addEventListener("change", async () => {
          const f = app.vault.getAbstractFileByPath(r.path);
          if (!f) return;
          await app.fileManager.processFrontMatter(f, fm => { fm.done = cb.checked; });
          applyDoneStyle(cb.checked);
          checkAllDone();
        });
      }
      g.appendChild(listDiv);
    }
    wrap.appendChild(g);
  }

  const msg = document.createElement("div");
  msg.style.marginTop = "6px";
  msg.style.textAlign = "left";
  msg.style.fontWeight = "500";

  const checkAllDone = () => {
    const boxes = wrap.querySelectorAll('input[type="checkbox"]');
    if (!boxes.length) { msg.textContent = ""; return; }
    msg.textContent = Array.from(boxes).every(x => x.checked) ? "All done, nice work! 🎉☕️" : "";
  };
  checkAllDone();

  dv.container.append(wrap, msg);
})();
~~~
[[🧠Mind Map]]
### My Habits for today:
```dataviewjs
const HABIT_FOLDER = "03 SaveBox/Active";

// Get date from current note's filename: DD MMM YYYY
const fileName = dv.current()?.file?.name ?? "";
const m = fileName.match(/(\d{1,2} [A-Za-z]{3} \d{4})/);

let fileDate = null;
if (m) fileDate = window.moment(m[1], "DD MMM YYYY").format("YYYY-MM-DD");

if (!fileDate) {
  dv.paragraph("No valid date found in filename.");
} else {
  const pages = dv.pages(`"${HABIT_FOLDER}"`)
    .where(p => p.file.name.includes("Habit -") || p.file.name.includes("🔁Habit -"));

  function pickTasksForDate(p) {
    const ts = p.file.tasks ?? [];
    const rx = new RegExp(`(?:\\s|\\^)${fileDate}\\s*$`);
    const dated = ts.filter(t => rx.test(t.text));
    if (!dated.length) return null;
    return dated.find(t => !t.completed) ?? dated[0];
  }

  const tasks = pages.array().map(pickTasksForDate).filter(Boolean);
  if (tasks.length) dv.taskList(tasks, false);
  else dv.paragraph(`No habit tasks for ${m[1]}.`);
}

```
### Overdue Tasks
~~~dataviewjs
(async () => {
  // --- host date from filename: "11 Oct 2025" or "2025-10-11"
  const host = dv.current().file.name;
  const m = window.moment(host, ["D MMM YYYY", "DD MMM YYYY", "YYYY-MM-DD"], true);
  if (!m.isValid()) { dv.paragraph("Filename needs a date like 11 Oct 2025 or 2025-10-11."); return; }
  const TODAY = m.startOf("day");

  // --- candidates: Task notes only, exclude Templates/Archive and names ending with "!"
  const pages = dv.pages().where(p =>
    !/Templates|Archive/i.test(p.file.folder) &&
    !/[!]\s*$/.test(p.file.name) &&
    p.file.name.includes("Task")
  );

  // --- helpers
  const prRank = { High: 1, Medium: 2, Med: 2, Low: 3 };
  const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  function sectionText(src, name) {
    const re = new RegExp(`^#{1,6}\\s+${rx(name)}\\s*$`, "gim");
    const m = re.exec(src); if (!m) return null;
    const start = m.index + m[0].length;
    const level = (m[0].match(/^#+/) || ["#"])[0].length;
    const next = new RegExp(`^#{1,${level}}\\s+`, "gim"); next.lastIndex = start;
    const n = next.exec(src);
    return { text: src.slice(start, n ? n.index : src.length) };
  }
  function firstCheckbox(sec) {
    const re = /^[ \t>]*[-*]\s+\[( |x|X)\]\s.*$/m;
    const m = re.exec(sec.text); if (!m) return null;
    return { checked: /\[(x|X)\]/.test(m[0]) };
  }

  // --- gather OVERDUE tasks (due date < TODAY)
  const rows = [];
  for (const p of pages) {
    // parse due from YAML
    let due = null;
    if (p.due) {
      const mdue = window.moment(String(p.due), ["YYYY-MM-DD", "D MMM YYYY", window.moment.ISO_8601], true);
      if (mdue.isValid()) due = mdue.startOf("day");
    }
    if (!due) continue;

    const daysDue = TODAY.diff(due, "days");
    if (daysDue <= 0) continue; // today or future are excluded

    // first checkbox under "My Task" to mirror your linking behavior
    const file = app.vault.getAbstractFileByPath(p.file.path);
    if (!file) continue;
    const text = await app.vault.read(file);
    const sec = sectionText(text, "My Task");
    if (!sec) continue;
    const box = firstCheckbox(sec);
    if (!box) continue;

    const checked = typeof p.done === "boolean" ? p.done : box.checked;

    rows.push({
      path: p.file.path,
      name: p.file.name,
      checked,
      pri: p.priority ?? "",
      dur: toNum(p.duration_hours ?? 0),
      daysDue,
    });
  }

  if (!rows.length) { dv.paragraph("No overdue tasks 🎉"); return; }

  // --- sort: most overdue first, then priority, then shorter duration
  rows.sort((a, b) => {
    const ap = prRank[a.pri] ?? 9, bp = prRank[b.pri] ?? 9;
    return b.daysDue - a.daysDue || ap - bp || (a.dur ?? 0) - (b.dur ?? 0);
  });

  // --- render: single flat list, checkbox + title + meta on one line (wraps naturally)
  const listDiv = document.createElement("div");

  for (const r of rows) {
    // grid: checkbox + content, meta inline with title (wraps to second visual line when needed)
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "auto 1fr";
    row.style.alignItems = "start";
    row.style.columnGap = "8px";
    row.style.rowGap = "0";
    row.style.padding = "2px 0";
    row.style.minWidth = "0";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = r.checked;
    cb.style.margin = "0";

    const content = document.createElement("div");
    content.style.minWidth = "0";
    content.style.lineHeight = "1.35";

    const link = document.createElement("a");
    link.textContent = r.name;
    link.href = "#";
    link.style.minWidth = "0";
    link.onclick = e => { e.preventDefault(); app.workspace.openLinkText(r.path, dv.current().file.path, false); };

    // meta: "<N> day(s) due · Priority · Duration"
    const meta = document.createElement("span");
    meta.style.opacity = "0.8";
    meta.style.marginLeft = "8px";
    const dueText = `${r.daysDue} day${r.daysDue === 1 ? "" : "s"} due`;
    const time = `${r.dur} hr${r.dur === 1 ? "" : "s"}`;
    const bits = [dueText, r.pri || "", time].filter(Boolean);
    meta.textContent = bits.length ? "· " + bits.join(" · ") : "";

    const doneMark = document.createElement("span");
    doneMark.textContent = " ✅";
    doneMark.style.marginLeft = "6px";
    doneMark.style.display = r.checked ? "inline" : "none";

    content.append(link, meta, doneMark);
    row.append(cb, content);
    listDiv.appendChild(row);

    const applyDoneStyle = done => {
      link.style.textDecoration = done ? "line-through" : "none";
      meta.style.display = done ? "none" : "inline";
      doneMark.style.display = done ? "inline" : "none";
    };
    applyDoneStyle(r.checked);

    // sync YAML `done` in the task note
    cb.addEventListener("change", async () => {
      const f = app.vault.getAbstractFileByPath(r.path);
      if (!f) return;
      await app.fileManager.processFrontMatter(f, fm => { fm.done = cb.checked; });
      applyDoneStyle(cb.checked);
      checkAllDone();
    });
  }

  // footer message when all overdue are checked
  const msg = document.createElement("div");
  msg.style.marginTop = "6px";
  msg.style.textAlign = "left";
  msg.style.fontWeight = "500";
  const checkAllDone = () => {
    const boxes = listDiv.querySelectorAll('input[type="checkbox"]');
    if (!boxes.length) { msg.textContent = ""; return; }
    msg.textContent = Array.from(boxes).every(x => x.checked) ? "All done, nice work! 🎉☕️" : "";
  };
  checkAllDone();

  dv.container.append(listDiv, msg);
})();
~~~
___
#### 🔄 End-of-Day Review
How did the day go?
What worked and what didn’t?
What will you do differently tomorrow?
'
'
'
'
---
### 📫Inbox:
(Remove suffix ! from file name to release)
~~~dataview
TABLE
  dateformat(file.ctime, "yyyy-MM-dd") AS Created,
  gap + " " + choice(gap = 1, "day", "days") AS Age
FROM "03 SaveBox/Active"
WHERE endswith(file.name, "!")
FLATTEN floor((
  date(dateformat(date(now), "yyyy-MM-dd"))
  - date(dateformat(file.ctime, "yyyy-MM-dd"))
).milliseconds / 86400000) AS gap
SORT file.ctime ASC

~~~
### 🔗Backlinks:
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

```templater
<%*
const HABIT_FOLDER = "03 SaveBox/Active";
const M = window.moment;

// --- Get date from current note filename ---
const fileName = tp.file.title; // current note filename without extension
const dateMatch = fileName.match(/(\d{1,2} [A-Za-z]{3} \d{4})/);

if (!dateMatch) {
  tR += "❌ No valid date found in filename.";
  return;
}

const today = M(dateMatch[1], "DD MMM YYYY").format("YYYY-MM-DD");
const todayKey = M(today, "YYYY-MM-DD").format("dddd");

// --- Day aliases ---
const dayAliases = {
  Monday: ["monday","mon","senin","sen"],
  Tuesday: ["tuesday","tue","tues","selasa","sel"],
  Wednesday: ["wednesday","wed","rabu","rab"],
  Thursday: ["thursday","thu","thur","thurs","kamis","kam"],
  Friday: ["friday","fri","jumat","jum'at","jum"],
  Saturday: ["saturday","sat","sabtu","sab"],
  Sunday: ["sunday","sun","minggu","ming","ahad","ahd"],
};

const aliasToKey = {};
for (const [k, arr] of Object.entries(dayAliases))
  for (const a of arr)
    aliasToKey[a.toLowerCase()] = k;

const files = app.vault.getMarkdownFiles()
  .filter(f => f.path.startsWith(HABIT_FOLDER + "/"))
  .filter(f => /(^| )Habit -|^🔁Habit -/.test(f.basename));

const hasTodayTask = (content) =>
  new RegExp(`^\\s*- \\[.\\] .*?(?:\\s|\\^)${today}\\s*$`, "m").test(content);

const pickCore = (basename) => {
  const parts = basename.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : basename;
};

const allAliases = Object.keys(aliasToKey).sort((a,b)=>b.length-a.length).join("|");
const aliasRe = new RegExp(`\\b(?:${allAliases})\\b`, "gi");

const extractWeekdays = (basename) => {
  const hits = basename.match(aliasRe);
  if (!hits) return [];
  return [...new Set(hits.map(s => aliasToKey[s.toLowerCase()]).filter(Boolean))];
};

for (const file of files) {
  let content = await app.vault.read(file);

  const weekdays = extractWeekdays(file.basename);
  const isWeekly = weekdays.length > 0;

  if (isWeekly && !weekdays.includes(todayKey)) continue;
  if (hasTodayTask(content)) continue;

  const core = pickCore(file.basename);
  const label = `Habit - ${core}`;
  const line  = `- [ ] 🔁${label} ${today} ^${today}`;

  const logHeaderRe = /(^|\n)###\s+Log\s*(?:\n|$)/;
  if (logHeaderRe.test(content)) {
    content = content.replace(logHeaderRe, (m, p1) => `${p1}### Log\n\n${line}\n`);
  } else {
    content = content.trimEnd() + `\n\n### Log\n\n${line}\n`;
  }

  await app.vault.modify(file, content);
}
%>

```


