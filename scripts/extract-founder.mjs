import fs from "node:fs";

const h = fs.readFileSync("public/mirror/index.html", "utf8");
const idx = h.indexOf("t543__wrapper");
const before = h.lastIndexOf('id="rec', idx);
console.log(h.slice(before, before + 180));
const end = h.indexOf('id="rec', idx + 10);
const s = h.slice(before, end > 0 ? end : before + 12000);
fs.writeFileSync("content/_founder-chunk.html", s, "utf8");
const imgs = [...s.matchAll(/\/tilda\/images\/[^"' )]+/g)].map((m) => m[0]);
console.log("imgs", [...new Set(imgs)]);
const dataOrig = [...s.matchAll(/data-original="([^"]+)"/g)].map((m) => m[1]);
console.log("data-original", dataOrig);
const styles = [...s.matchAll(/background-image:\s*url\(([^)]+)\)/g)].map((m) => m[1]);
console.log("bg", styles);
console.log("has cover", /t-cover|t543__blockimg|bgimg/.test(s));
console.log(s.slice(0, 2500));
