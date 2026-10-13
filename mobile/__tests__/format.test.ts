import { expect, test } from "@jest/globals";
import { money, phoneHref, stripHtml } from "../src/lib/format";

test("money formats RUB with ru-RU grouping", () => {
  expect(money(4500000)).toMatch(/4[\s\u00a0]500[\s\u00a0]000/);
  expect(money(4500000)).toContain("₽");
});

test("phoneHref strips non-digits except leading +", () => {
  expect(phoneHref("+7 (933) 211-61-98")).toBe("tel:+79332116198");
});

test("stripHtml removes tags and collapses space", () => {
  expect(stripHtml("<p>ЖК&nbsp;<b>Тест</b></p>")).toBe("ЖК Тест");
});
