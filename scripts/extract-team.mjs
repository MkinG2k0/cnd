import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");
const start = h.indexOf('id="rec3422807401"');
const next = h.indexOf('id="rec', start + 10);
const chunk = h.slice(start, next > 0 ? next : undefined);

const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// T524 cards often: bgimg + name + descr
const people = [];
const cardRe =
  /(?:data-original|background-image:url\(')(\/tilda\/images\/[^'")]+)[\s\S]{0,2500}?t-name[^>]*>\s*([\s\S]*?)<\/[^>]+>[\s\S]{0,800}?t-descr[^>]*>\s*([\s\S]*?)<\//gi;

let m;
while ((m = cardRe.exec(chunk))) {
  people.push({
    image: m[1],
    name: strip(m[2]),
    role: strip(m[3]),
  });
}

// Alternate: name then nearby image before
if (!people.length) {
  const nameRe = /t-name[^>]*>\s*([\s\S]*?)<\/[^>]+>[\s\S]{0,600}?t-descr[^>]*>\s*([\s\S]*?)<\//gi;
  while ((m = nameRe.exec(chunk))) {
    const name = strip(m[1]);
    const role = strip(m[2]);
    const before = chunk.slice(Math.max(0, m.index - 2000), m.index);
    const imgs = [...before.matchAll(/(\/tilda\/images\/[^"' )]+)/g)].map((x) => x[1]);
    people.push({ name, role, image: imgs.at(-1) || "" });
  }
}

console.log(JSON.stringify(people, null, 2));

// Also dump all image refs in this rec
const imgs = [...chunk.matchAll(/\/tilda\/images\/[^"' )]+/g)].map((m) => m[0]);
console.log("all imgs", [...new Set(imgs)]);

// About section texts
const aboutStart = h.indexOf('id="rec2197338051"');
const aboutNext = h.indexOf('id="rec', aboutStart + 10);
const about = h.slice(aboutStart, aboutNext);
console.log(
  "about title texts",
  [...about.matchAll(/>([^<]{20,400})</g)]
    .map((x) => x[1].replace(/\s+/g, " ").trim())
    .filter((t) => /[А-Яа-я]/.test(t)),
);

// Contact
const cStart = h.indexOf('id="rec3422822201"');
const cNext = h.indexOf('id="rec', cStart + 10);
const contact = h.slice(cStart, cNext > 0 ? cNext : undefined);
console.log(
  "contact texts",
  [...contact.matchAll(/>([^<]{5,200})</g)]
    .map((x) => x[1].replace(/\s+/g, " ").trim())
    .filter((t) => /[А-Яа-я0-9+]/.test(t) && !/function|rgb|border|font/i.test(t)),
);
