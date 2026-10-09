import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");

function sliceRec(id) {
  const start = h.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const next = h.indexOf('id="rec', start + 10);
  return h.slice(start, next > 0 ? next : undefined);
}

const strip = (s) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

for (const id of [
  "rec2197338051",
  "rec3422809201",
  "rec3422807401",
  "rec3422822201",
  "rec2197276881",
]) {
  const chunk = sliceRec(id);
  console.log("\n====", id, "len", chunk.length);
  const imgs = [...chunk.matchAll(/(?:src|data-original|background-image:url\(')(\/tilda\/images\/[^'")]+)/g)].map(
    (m) => m[1],
  );
  console.log("imgs", [...new Set(imgs)]);
  const texts = [...chunk.matchAll(/>([^<]{15,500})</g)]
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter((t) => /[А-Яа-я]/.test(t) && !/function|var |https?:|rgb\(|border|font-|padding|margin|webkit/i.test(t));
  console.log("texts", [...new Set(texts)].slice(0, 40));
}

// Find founder photo by looking for Ген. Директор context
const idx = h.indexOf("Ген. Директор");
console.log("\nfounder idx", idx);
if (idx > 0) {
  const s = h.slice(Math.max(0, idx - 8000), idx + 1500);
  console.log(
    "imgs near Ген",
    [...s.matchAll(/(?:src|data-original|url\(')(\/tilda\/images\/[^'")]+)/g)].map((m) => m[1]),
  );
  console.log("snippet", strip(s).slice(0, 800));
}
