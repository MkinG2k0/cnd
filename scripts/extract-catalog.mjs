import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");

const strip = (s) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

// Tilda catalog: jsontable / product nodes often embed title + descr + img
const fromJson = [];
const jsonChunks = [...h.matchAll(/"title"\s*:\s*"([^"]+)"[\s\S]{0,800}?"descr"\s*:\s*"([^"]*)"/g)];
for (const m of jsonChunks) {
  fromJson.push({
    name: strip(JSON.parse(`"${m[1]}"`)),
    description: strip(JSON.parse(`"${m[2]}"`)),
  });
}

// Also try t-store parts with img nearby
const blocks = [];
const cardRe =
  /class="[^"]*t-store__card[^"]*"[\s\S]{0,5000}?(?=class="[^"]*t-store__card|t-store__grid__separator|$)/gi;
let m;
while ((m = cardRe.exec(h))) {
  const chunk = m[0];
  const title =
    (chunk.match(/t-store__card__title[^>]*>\s*([\s\S]*?)<\//) || [])[1] ||
    (chunk.match(/js-store-prod-name[^>]*>\s*([\s\S]*?)<\//) || [])[1] ||
    "";
  const descr =
    (chunk.match(/t-store__card__descr[^>]*>\s*([\s\S]*?)<\//) || [])[1] ||
    (chunk.match(/js-store-prod-descr[^>]*>\s*([\s\S]*?)<\//) || [])[1] ||
    "";
  const img =
    (chunk.match(/src="(\/tilda\/images\/[^"]+)"/) || [])[1] ||
    (chunk.match(/data-original="(\/tilda\/images\/[^"]+)"/) || [])[1] ||
    (chunk.match(/url\(&quot;(\/tilda\/images\/[^&]+)/) || [])[1] ||
    "";
  const name = strip(title);
  if (!name) continue;
  blocks.push({ name, description: strip(descr), image: img });
}

// Employee blocks
const people = [];
const personRe =
  /class="[^"]*t-item[^"]*"[\s\S]{0,3000}?t-name[^>]*>\s*([\s\S]*?)<\/[^>]+>[\s\S]{0,800}?t-descr[^>]*>\s*([\s\S]*?)<\//gi;
while ((m = personRe.exec(h))) {
  const name = strip(m[1]);
  const role = strip(m[2]);
  const around = h.slice(Math.max(0, m.index - 500), m.index + 500);
  const img =
    (around.match(/src="(\/tilda\/images\/[^"]+)"/) || [])[1] ||
    (h.slice(m.index, m.index + 2500).match(/src="(\/tilda\/images\/[^"]+)"/) || [])[1] ||
    "";
  if (name.length > 2 && name.length < 80) people.push({ name, role, image: img });
}

// Rich about / project texts with ЖК headings
const texts = [];
const textRe = /<(?:div|p)[^>]*class="[^"]*t(?:n)?-atom[^"]*"[^>]*>([\s\S]{40,2000}?)<\//gi;
while ((m = textRe.exec(h))) {
  const t = strip(m[1]);
  if (t.length > 60 && /ЖК|новостро|квартир|Махачкал|Дагестан/i.test(t)) texts.push(t);
}

const phones = [
  ...new Set(
    [...h.matchAll(/\+7\s*\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g)].map((x) =>
      x[0].replace(/\s+/g, " ").trim(),
    ),
  ),
];

const out = {
  catalog: blocks.length ? blocks : fromJson,
  people: [...new Map(people.map((p) => [p.name, p])).values()],
  texts: [...new Set(texts)].slice(0, 40),
  phones,
  email: "cndnedvizhka05@gmail.com",
};

fs.writeFileSync("content/catalog.json", JSON.stringify(out, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      catalog: out.catalog.length,
      sample: out.catalog.slice(0, 5),
      people: out.people,
      texts: out.texts.length,
      phones: out.phones,
    },
    null,
    2,
  ),
);
