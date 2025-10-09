
>[!quote] If you want to live a happy life, tie it to a goal, not to people or things.
>— Albert Einstein

___

>[!tip] Step 1: 🌱Define Your Areas
>- Write down the areas of life that matter to you ❤️. Examples: Health, Relationships, Career, Money, Faith, Travel. 
>- Hint: Start light with with one or two Area's only.
>- Create your Area as a link file. Name it with prefix "Area - " 
## Write your Areas here👇
Hint: Create a link to your Area page using prefix: `Area - `
[[🌱Area - example 1]]
[[🌱Area - example 2]]


>[!tip] Step 2: 🌱Work from the Area page 
>- Open  each areas you've just made,
>- Follow the instruction In the area page😊


~~~dataviewjs
const folders = ["01 Definition","02 Execution","03 SaveBox/Active","04 Output"];

// Get all Areas
const areas = dv.pages()
  .where(p => folders.some(f => p.file.folder.startsWith(f)))
  .where(p => p.file.name.includes("Area"))
  .where(p => !p.file.name.startsWith("!")) // exclude names starting with "!"
  .sort(p => p.file.name);

// Get all Goals
const goals = dv.pages()
  .where(p => folders.some(f => p.file.folder.startsWith(f)))
  .where(p => p.file.name.includes("Goal"));

for (const a of areas) {
  // Find goals linked to this area (both directions)
  const kids = goals
    .where(g =>
      a.file.outlinks.some(l => l.path === g.file.path) ||
      g.file.outlinks.some(l => l.path === a.file.path)
    )
    .sort(g => g.file.name);

  if (kids.length) {
    dv.header(4, a.file.link);
    dv.list(kids.map(g => g.file.link));
  }
}


~~~
### ✍️Comments:
''
___

>[!info]  *🔗 Backlinks*
>~~~dataviewjs
>const backlinks = dv.pages()
>.where(p => p.file.outlinks.some(l => l.path === dv.current().file.path))
>.sort(p => p.file.name);
>if (backlinks.length) 
>{dv.list(backlinks.map(p =>p.file.link));
>} else {
>dv.paragraph("None");
  }
>~~~

