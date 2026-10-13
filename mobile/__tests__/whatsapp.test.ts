import { expect, test } from "@jest/globals";
import {
  buildQuizMessage,
  isCustomOption,
  whatsappURL,
} from "../src/lib/whatsapp";

test("whatsappURL sets text query param", () => {
  const href = whatsappURL("https://wa.me/79332116198", "Привет");
  expect(href).toContain("wa.me/79332116198");
  expect(decodeURIComponent(href)).toContain("Привет");
});

test("isCustomOption detects custom labels", () => {
  expect(isCustomOption("Свой вариант")).toBe(true);
  expect(isCustomOption("1-комнатная")).toBe(false);
});

test("buildQuizMessage includes answers and optional product", () => {
  const msg = buildQuizMessage({
    quiz: [{ title: "Планировка", options: [], images: [] }],
    answers: [["Студия"]],
    customs: [""],
    contactName: "Али",
    contactPhone: "+7999",
    productName: "ЖК Тест",
  });
  expect(msg).toContain("Помогите подобрать квартиру");
  expect(msg).toContain("Планировка Студия");
  expect(msg).toContain("ФИО: Али");
  expect(msg).toContain("Телефон: +7999");
  expect(msg).toContain("Интересует ЖК: ЖК Тест");
});
