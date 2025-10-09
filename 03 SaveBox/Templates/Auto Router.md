<%*
/**
 * Auto Router — rename BEFORE include (final)
 * Filename format: "<emoji><Label> - <core>"
 * Keywords: task / goal / habit / project / area / note / res(resolution)
 * Folder: adjust "06 Templates/..." if your paths differ
 */

const rawTitle = (tp.file.title ?? "").trim();

// Remove leading "!" if you use it in titles; matching is done on 'bare'
const bare = rawTitle.replace(/^!+/, "");

// ---------- CONFIG ----------
const SEP = " - ";               // separator between Label and core
const SPACE_AFTER_EMOJI = false; // set true to use "📌 Task - ..." instead of "📌Task - ..."

// kind rules: regex to detect, regex to strip keyword, candidate template paths, emoji & label
const rules = [
  { kind:'task',    re:/^task\b/i,            strip:/^\s*task\b[\s—\-:]*?/i,               paths:["03 SaveBox/Templates/Task Template.md"],          emoji:'📌', label:'Task' },
  { kind:'goal',    re:/^goal\b/i,            strip:/^\s*goal\b[\s—\-:]*?/i,               paths:["03 SaveBox/Templates/Goal Template.md"],          emoji:'🎯', label:'Goal' },
  { kind:'habit',   re:/^habit\b/i,           strip:/^\s*habit\b[\s—\-:]*?/i,
  paths:["03 SaveBox/Templates/Habit Template 2.md"], emoji:'🔁', label:'Habit' },
  { kind:'project', re:/^project\b/i,         strip:/^\s*project\b[\s—\-:]*?/i,            paths:["03 SaveBox/Templates/Project Template.md"],       emoji:'🚀', label:'Project' },
  { kind:'area',    re:/^area\b/i,            strip:/^\s*area\b[\s—\-:]*?/i,               paths:["03 SaveBox/Templates/Area Template.md"],          emoji:'🌱', label:'Area' },
  { kind:'note',    re:/^note\b/i,            strip:/^\s*note\b[\s—\-:]*?/i,               paths:["03 SaveBox/Templates/Note Template.md"],          emoji:'✏️', label:'Note' },
  { kind:'res',     re:/^(res(olution)?)\b/i, strip:/^\s*(?:res(?:olution)?)\b[\s—\-:]*?/i,paths:["03 SaveBox/Templates/Resolution Template.md"],    emoji:'🎯', label:'Resolution' },
];

const rule = rules.find(r => r.re.test(bare));
if (!rule) {
  tR = `> [!warning] Router\n> No rule matched: **${rawTitle}**.\n> Start the title with: task / goal / habit / project / area / note / res.`;
  %><%* return %><%*
}

// resolve template path (first that exists)
let tf = null, usedPath = null;
for (const p of rule.paths) {
  const f = app.vault.getAbstractFileByPath(p);
  if (f) { tf = f; usedPath = p; break; }
}
if (!tf) {
  tR = `> [!failure] Router\n> Template not found in any of:\n> ${rule.paths.map(p=>"- "+p).join("\n> ")}`;
  %><%* return %><%*
}

// CORE text = title with keyword stripped, then trim any leading separators like "-" "—" ":"
let core = bare.replace(rule.strip, "").replace(/^[\s\-—:]+/, "").trim();
if (!core) core = "Untitled";

// Desired filename: "<emoji><opt space><Label> - <core>"
const emojiPart = rule.emoji + (SPACE_AFTER_EMOJI ? " " : "");
let desired = `${emojiPart}${rule.label}${SEP}${core}`.replace(/[\\/:*?"<>|]/g, " "); // Windows-safe

// Rename BEFORE including, with collision handling
if (tp.file.title !== desired) {
  const folder = tp.file.folder(true);
  const exists = (nameNoExt) => !!app.vault.getAbstractFileByPath(`${folder}/${nameNoExt}.md`);
  if (exists(desired)) {
    let i = 1;
    while (exists(`${desired} (${i})`)) i++;
    desired = `${desired} (${i})`;
  }
  await tp.file.rename(desired);
}

// Include the chosen template body (templates should NOT do renames)
let body = await tp.file.include(tf);

// (Optional) Checkbox injector is intentionally disabled for your setup

tR = body;
%>
