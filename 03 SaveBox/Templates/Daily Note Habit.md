---
created: <% tp.date.now("YYYY-MM-DD") %>
---

# <% tp.date.now("YYYY-MM-DD ddd") %>

<%* await tp.user.habits_today({ folder: "Habits", newestFirst: true }) %>

## Today’s Habits (live checkboxes via transclusions)
```dataviewjs
const maybeLuxon = dv.current()?.file?.day;
const today = maybeLuxon ? maybeLuxon.toFormat("yyyy-LL-dd") : window.moment().format("YYYY-MM-DD");

// all habit files under Habits/
const habits = dv.pages('"Habits"')
  .where(p => p.file.path.endsWith('.md')) // dv strips .md in p.file.name, but path keeps it
  .sort(p => p.file.name.toLowerCase());

if (habits.length === 0) {
  dv.paragraph("_No habit files found in `Habits/`_");
} else {
  for (const h of habits) {
    // render a single-line live transclusion for today’s block
    dv.paragraph(`**${h.file.name}**  →  ![[${h.file.path}#^${today}]]`);
  }
}
