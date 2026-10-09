import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");

const strip = (s) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

function sliceRec(id) {
  const start = h.indexOf(`id="${id}"`);
  if (start < 0) return "";
  const next = h.indexOf('id="rec', start + 10);
  return h.slice(start, next > 0 ? next : undefined);
}

const catalog = [];
const cardRe =
  /data-product-lid="(\d+)"[\s\S]*?data-original="(\/tilda\/images\/[^"]+)"[\s\S]*?js-product-name[^>]*>\s*([\s\S]*?)<\/div>\s*<div class="t778__descr[^"]*"[^>]*>\s*([\s\S]*?)<\/div>[\s\S]*?js-product-price[^>]*>\s*([^<]*)</gi;
let m;
while ((m = cardRe.exec(h))) {
  const id = m[1];
  if (catalog.some((c) => c.id === id)) continue;
  catalog.push({
    id,
    name: strip(m[3]),
    summary: strip(m[4]),
    priceFrom: Number(strip(m[5]).replace(/\D/g, "")) || null,
    image: m[2],
    details: "",
  });
}
for (const item of catalog) {
  const full = h.match(
    new RegExp(
      `id="t778__product-${item.id}"[\\s\\S]*?t778__descr[^>]*>\\s*([\\s\\S]*?)<\\/div>`,
      "i",
    ),
  );
  if (full) item.details = strip(full[1]);
}

const aboutChunk = sliceRec("rec2197338051");
const aboutParagraphs = [...aboutChunk.matchAll(/>([^<]{40,500})</g)]
  .map((x) => x[1].replace(/\s+/g, " ").trim())
  .filter((t) => /[А-Яа-я]/.test(t) && !/function|rgb\(|border/i.test(t));

const founderBio =
  strip(
    (
      h.match(
        /field="text">([\s\S]*?Мустафа открыл свою компанию[\s\S]*?предоставляемых услуг\.)/,
      ) || []
    )[1] || "",
  ) ||
  "В 2025 году Мустафа открыл свою компанию, занимающуюся продажей проверенных новостроек по Дагестану. Основные принципы, на которых строится его бизнес, — это профессионализм, честность, прозрачная система, а также гибкость и удобство предоставляемых услуг.";

const teamChunk = sliceRec("rec3422807401");
const team = [];
const teamRe =
  /(?:data-original|background-image:url\(')(\/tilda\/images\/[^'")]+)[\s\S]{0,2500}?t-name[^>]*>\s*([\s\S]*?)<\/[^>]+>[\s\S]{0,800}?t-descr[^>]*>\s*([\s\S]*?)<\//gi;
while ((m = teamRe.exec(teamChunk))) {
  team.push({ image: m[1], name: strip(m[2]), role: strip(m[3]) });
}
if (!team.length) {
  const nameRe =
    /t-name[^>]*>\s*([\s\S]*?)<\/[^>]+>[\s\S]{0,600}?t-descr[^>]*>\s*([\s\S]*?)<\//gi;
  while ((m = nameRe.exec(teamChunk))) {
    const name = strip(m[1]);
    const role = strip(m[2]);
    const before = teamChunk.slice(Math.max(0, m.index - 2000), m.index);
    const imgs = [...before.matchAll(/(\/tilda\/images\/[^"' )]+)/g)].map((x) => x[1]);
    if (name && role) team.push({ name, role, image: imgs.at(-1) || "" });
  }
}

const quiz = {
  title: "Недвижимость Дагестана",
  intro:
    "Ответьте на несколько простых вопросов, чтобы найти квартиру подходящего размера, который будет соответствовать вашему стилю и потребностям.",
  steps: [
    {
      title: "Планировка квартиры",
      options: ["Студия", "Однокомнатная квартира", "Двухкомнатная квартира"],
    },
    {
      title: "Ваш первоначальный взнос?",
      options: [
        "От 200тыс до500тыс",
        "От 500тыс до 1млн",
        "От 1 млн и больше",
        "Полная оплата",
        "Свой вариант",
      ],
    },
    {
      title: "В каких районах рассматриваете квартиру?",
      options: [
        "Центр города",
        "Первая Махачкала",
        "Акушинского",
        "Редукторный",
        "Аметхана Султана",
      ],
      multi: true,
    },
    {
      title: "На какой ежемесячный платеж расчитываете?",
      options: [
        "от 30тыс до 50 тыс",
        "от 50тыс до 80тыс",
        "от 80 тыс до 100тыс",
        "от 100тыс и больше",
        "Ваш вариант",
      ],
    },
    {
      title: "Когда планируете покупку квартиры если найдете подходящий вариант?",
      options: [
        "Сразу как найду",
        "В течении недели",
        "В течении месяца",
        "Пока присматриваюсь, не готов еще преобрести",
      ],
    },
  ],
};

const out = {
  brand: "Недвижимость Дагестана",
  shortBrand: "ЦНД",
  tagline: "Квартиры в новостройках Махачкалы, Каспийска и Дербента",
  phone: "+7 (903) 428-61-98",
  phoneHref: "tel:+79034286198",
  email: "cndnedvizhka05@gmail.com",
  address: "5-я линия Акушинского 25 (2 этаж), г. Махачкала",
  logo: "/tilda/images/tild3939-6632-4631-b436-343464393832__EnTjLTAN0gFKiGRE1Es3.jpg",
  aboutTitle: "Кто мы?",
  aboutParagraphs,
  founder: {
    name: "Алиметов Мустафа",
    role: "Ген. директор и основатель",
    bio: founderBio,
    image:
      "/tilda/images/tild6237-3035-4366-b238-613862393235__5Q9iLF_SWHmyW1SEJwlD.jpg",
  },
  teamTitle: "Наши специалисты",
  teamIntro:
    "Самые лучшие менеджера каждый день работают над тем, чтобы предоставлять лучший сервис и лучшие предложения на рынке недвижимости",
  team,
  contactTitle: "Свяжитесь с нами без промедления",
  catalog,
  quiz,
  heroImage: catalog[0]?.image || "",
};

fs.writeFileSync("content/site.json", JSON.stringify(out, null, 2), "utf8");
console.log(
  JSON.stringify(
    {
      catalog: out.catalog.length,
      about: out.aboutParagraphs.length,
      team: out.team.map((t) => t.name),
      founderImage: out.founder.image,
      quizSteps: out.quiz.steps.length,
    },
    null,
    2,
  ),
);
