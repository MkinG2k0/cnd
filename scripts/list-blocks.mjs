import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");

const recs = [...h.matchAll(/id="(rec\d+)" class="r t-rec[^"]*"[^>]*data-record-type="(\d+)"/g)].map(
  (m) => {
    const id = m[1];
    const type = m[2];
    const start = m.index;
    const next = h.indexOf('id="rec', start + 10);
    const chunk = h.slice(start, next > 0 ? next : start + 8000);
    const title = (
      chunk.match(/field="title"[^>]*>\s*([\s\S]*?)<\//) ||
      chunk.match(/t-section__title[^>]*>\s*([\s\S]*?)<\//) ||
      chunk.match(/t-title[^>]*>\s*([\s\S]*?)<\//) ||
      []
    )[1];
    const name = (
      chunk.match(/t-name[^>]*>\s*([\s\S]*?)<\//) || []
    )[1];
    const imgs = [...chunk.matchAll(/(?:src|data-original)="(\/tilda\/images\/[^"]+)"/g)].map(
      (x) => x[1],
    );
    const textBits = [...chunk.matchAll(/t-text[^>]*>\s*([\s\S]{20,400}?)<\//g)]
      .map((x) => x[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter((t) => /[А-Яа-я]/.test(t))
      .slice(0, 3);
    return {
      id,
      type,
      title: title ? title.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "",
      name: name ? name.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "",
      imgs: [...new Set(imgs)].slice(0, 6),
      textBits,
    };
  },
);

console.log(JSON.stringify(recs, null, 2));
