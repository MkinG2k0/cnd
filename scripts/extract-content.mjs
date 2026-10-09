import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");

const strip = (s) =>
  s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const imgSrcs = [...h.matchAll(/src="(\/tilda\/images\/[^"]+)"/gi)].map((m) => m[1]);
const bgImgs = [...h.matchAll(/url\((?:&quot;|['"])?(\/tilda\/images\/[^)'"&]+)/gi)].map(
  (m) => m[1],
);

// Catalog items: t776 / t778 product blocks often have name + descr
const products = [];
const productBlocks = [
  ...h.matchAll(
    /t-store__card[\s\S]{0,4000}?t-store__card__title[\s\S]{0,200}?>([^<]+)[\s\S]{0,1200}?t-store__card__descr[\s\S]{0,400}?>([\s\S]{0,500}?)<\//gi,
  ),
];
for (const m of productBlocks) {
  products.push({ name: strip(m[1]), description: strip(m[2]) });
}

// Fallback: scan for ЖК lines
if (products.length < 5) {
  const names = [
    ...h.matchAll(/(ЖК\s[^<\n]{2,60}|Гранд Эра)/g),
  ].map((m) => strip(m[1]));
  const uniq = [...new Set(names)].filter((n) => n.length > 2 && n.length < 80);
  for (const name of uniq) {
    if (!products.some((p) => p.name === name)) products.push({ name, description: "" });
  }
}

// Team
const team = [];
const personBlocks = [
  ...h.matchAll(
    /t-name[^>]*>([^<]{2,80})[\s\S]{0,400}?t-descr[^>]*>([^<]{2,120})/gi,
  ),
];
for (const m of personBlocks) {
  const name = strip(m[1]);
  const role = strip(m[2]);
  if (/менеджер|директор|риелтор|специалист/i.test(role + name) || /Алиметов|Муст/i.test(name)) {
    team.push({ name, role });
  }
}

// Long text blocks that look like about
const aboutCandidates = [...h.matchAll(/t-text[^>]*>([\s\S]{80,1200}?)<\//gi)]
  .map((m) => strip(m[1]))
  .filter((t) => t.length > 80 && /[А-Яа-я]/.test(t) && !/cookie|function|var /.test(t));

const emails = [
  ...new Set(
    [...h.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map((m) => m[0]),
  ),
].filter((e) => !/perfect-a|example|tilda/i.test(e));

const phones = [
  ...new Set(
    [...h.matchAll(/(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g)].map(
      (m) => m[0],
    ),
  ),
];

const nav = [...h.matchAll(/data-menu-item-number[^>]*>[\s\S]{0,200}?>([^<]{2,40})</gi)].map(
  (m) => strip(m[1]),
);

const out = {
  title: (h.match(/<title>(.*?)<\/title>/i) || [])[1] || "",
  nav: [...new Set(nav)].filter(Boolean),
  products,
  team: [...new Map(team.map((t) => [t.name, t])).values()],
  about: aboutCandidates.slice(0, 20),
  emails,
  phones,
  images: [...new Set([...imgSrcs, ...bgImgs])],
};

fs.mkdirSync("content", { recursive: true });
fs.writeFileSync("content/site-content.json", JSON.stringify(out, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      products: out.products.length,
      team: out.team.length,
      about: out.about.length,
      images: out.images.length,
      emails: out.emails,
      phones: out.phones,
      nav: out.nav,
    },
    null,
    2,
  ),
);
