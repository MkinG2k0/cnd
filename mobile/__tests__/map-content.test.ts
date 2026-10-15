import { expect, test } from "@jest/globals";
import { mapProduct, mapSiteSettings } from "../src/lib/map-content";

test("mapProduct prefers slug.current and builds image URL string", () => {
  const product = mapProduct({
    _id: "p1",
    legacyId: "legacy-1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "Описание",
    detailHtml: "<p>Детали</p>",
    price: 1000000,
    city: "Махачкала",
    imageUrl: "https://cdn.sanity.io/images/example.jpg",
    galleryUrls: [],
    projectPdf: "https://example.com/a.pdf",
  });

  expect(product).toEqual({
    id: "legacy-1",
    sanityId: "p1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "Описание",
    detailHtml: "<p>Детали</p>",
    price: 1000000,
    city: "Махачкала",
    imageUrl: "https://cdn.sanity.io/images/example.jpg",
    galleryUrls: [],
    projectPdf: "https://example.com/a.pdf",
  });
});

test("mapProduct falls back id to _id and empty optional fields", () => {
  const product = mapProduct({
    _id: "p2",
    name: "Без slug",
    slug: "bez-slug",
    description: "",
    price: 0,
    city: "Каспийск",
    imageUrl: "",
  });

  expect(product.id).toBe("p2");
  expect(product.projectPdf).toBeUndefined();
  expect(product.detailHtml).toBe("");
});

test("mapProduct maps galleryUrls", () => {
  const product = mapProduct({
    _id: "p1",
    name: "ЖК Тест",
    slug: "zhk-test",
    description: "",
    price: 1,
    city: "Махачкала",
    imageUrl: "https://cdn/cover.jpg",
    galleryUrls: ["https://cdn/a.jpg", "https://cdn/b.jpg"],
  });

  expect(product.galleryUrls).toEqual([
    "https://cdn/a.jpg",
    "https://cdn/b.jpg",
  ]);
});

test("mapSiteSettings maps contacts and quiz", () => {
  const settings = mapSiteSettings({
    quizIntro: "Intro",
    about: ["A"],
    founder: {
      name: "Мустафа",
      role: "Основатель",
      bio: "Bio",
      imageUrl: "",
    },
    contacts: {
      phone: "+7 933",
      email: "a@b.c",
      address: "Адрес",
      whatsapp: "https://wa.me/79332116198",
      telegram: "https://t.me/x",
      instagram: "https://instagram.com/x",
    },
    quiz: [{ title: "Планировка", options: ["1", "2"], images: [] }],
  });

  expect(settings.contacts.whatsapp).toContain("wa.me");
  expect(settings.quiz[0].title).toBe("Планировка");
  expect(settings.founder.name).toBe("Мустафа");
});
