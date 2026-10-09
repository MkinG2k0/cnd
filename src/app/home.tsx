"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  cityCounts,
  content,
  money,
  phoneHref,
  productPath,
} from "../lib/content";
import { HeroSlider } from "./hero-slider";
import { HomeScrollRestore } from "./home-scroll-restore";
import { MotionRoot } from "./motion";
import { ProductLink } from "./product-link";
import { QuizPanel } from "./quiz-panel";

type CityFilter = "all" | string;
type SortMode = "default" | "asc" | "desc";

export function Home() {
  const [city, setCity] = useState<CityFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const geography = cityCounts(content.products);
  const phoneLink = phoneHref(content.contacts.phone);

  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ru");
    let list = content.products.filter(
      (p) =>
        (city === "all" || p.city === city) &&
        `${p.name} ${p.description}`.toLocaleLowerCase("ru").includes(q),
    );
    if (sort !== "default") {
      list = [...list].sort((a, b) =>
        sort === "asc" ? a.price - b.price : b.price - a.price,
      );
    }
    return list;
  }, [city, query, sort]);

  const visible = expanded ? matches : matches.slice(0, 6);
  const showMore = !expanded && matches.length > 6;

  function selectCity(next: CityFilter) {
    setCity(next);
    setExpanded(false);
  }

  return (
    <>
      <HomeScrollRestore />
      <MotionRoot />
      <a className="skip" href="#catalog">
        Перейти к каталогу
      </a>

      <header className="header wrap">
        <a href="#" className="brand" aria-label="ЦНД — на главную">
          <Image src={content.logo} alt="" width={57} height={57} sizes="57px" />
          <span>
            <b>ЦНД</b>
            <small>
              Центр недвижимости
              <br />
              Дагестана
            </small>
          </span>
        </a>
        <nav
          id="navigation"
          className={menuOpen ? "open" : undefined}
          aria-label="Основная навигация"
        >
          <a href="#catalog" onClick={() => setMenuOpen(false)}>
            Наши дома
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            О нас
          </a>
          <a href="#team" onClick={() => setMenuOpen(false)}>
            Сотрудники
          </a>
          <a href="#quiz" onClick={() => setMenuOpen(false)}>
            Подбор
          </a>
          <a href="#contacts" onClick={() => setMenuOpen(false)}>
            Контакты
          </a>
        </nav>
        <a className="header-phone" href={phoneLink}>
          {content.contacts.phone}
          <span>Связаться с нами</span>
        </a>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰
        </button>
      </header>

      <main>
        <section className="hero wrap hero-enter" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="location hero-enter-item" style={{ "--d": "0ms" } as CSSProperties}>
              <span className="location-dot" />
              Махачкала, Каспийск, Дербент
            </div>
            <h1 id="hero-title" className="hero-enter-item" style={{ "--d": "80ms" } as CSSProperties}>
              Недвижимость
              <br />
              Дагестана
            </h1>
            <p className="hero-enter-item" style={{ "--d": "160ms" } as CSSProperties}>
              {content.quizIntro}
            </p>
            <a
              href="#quiz"
              className="button light hero-enter-item"
              style={{ "--d": "240ms" } as CSSProperties}
            >
              Ответить на вопросы <span aria-hidden="true">↗</span>
            </a>
            <a
              className="hero-catalog hero-enter-item"
              style={{ "--d": "300ms" } as CSSProperties}
              href="#catalog"
            >
              Посмотреть наши дома
            </a>
            <div
              className="hero-note hero-enter-item"
              style={{ "--d": "360ms" } as CSSProperties}
            >
              <span className="mini-symbol" aria-hidden="true">
                ⌂
              </span>
              <span>Индивидуально под запрос каждого</span>
            </div>
          </div>
          <div className="hero-enter-item hero-slider-wrap" style={{ "--d": "120ms" } as CSSProperties}>
            <HeroSlider />
          </div>
        </section>

        <div className="geography wrap reveal">
          <p>
            Помогаем найти
            <br />
            своё место в Дагестане
          </p>
          {geography.map(({ city: name, count }, i) => (
            <a
              key={name}
              href="#catalog"
              className="geo-link"
              style={{ "--d": `${i * 60}ms` } as CSSProperties}
              onClick={() => selectCity(name)}
            >
              {name}{" "}
              <span>
                {count}{" "}
                {count === 1
                  ? "комплекс"
                  : count < 5
                    ? "комплекса"
                    : "комплексов"}
              </span>
            </a>
          ))}
        </div>

        <section className="catalog-section section" id="catalog">
          <div className="wrap">
            <div className="section-heading reveal">
              <div>
                <p className="section-kicker">Квартиры в новостройках</p>
                <h2>
                  Наши дома
                  <span className="count-badge">{content.products.length}</span>
                </h2>
              </div>
              <p>
                Выберите город и познакомьтесь
                <br />
                с жилыми комплексами поближе.
              </p>
            </div>

            <div className="catalog-toolbar">
              <div className="city-tabs" role="group" aria-label="Город">
                {(
                  [
                    ["all", "Все города"],
                    ["Махачкала", "Махачкала"],
                    ["Каспийск", "Каспийск"],
                    ["Дербент", "Дербент"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={city === value ? "active" : undefined}
                    aria-pressed={city === value}
                    onClick={() => selectCity(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Название или район"
                  aria-label="Поиск по названию или району"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setExpanded(false);
                  }}
                />
              </label>
            </div>

            <div className="catalog-meta">
              <span aria-live="polite">
                Найдено комплексов: {matches.length}
              </span>
              <label>
                Сортировка:{" "}
                <select
                  aria-label="Сортировка объектов"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                >
                  <option value="default">По умолчанию</option>
                  <option value="asc">Сначала дешевле</option>
                  <option value="desc">Сначала дороже</option>
                </select>
              </label>
            </div>

            <div className="properties">
              {visible.length === 0 ? (
                <p className="empty">
                  По вашему запросу ничего не найдено.
                  <br />
                  Попробуйте другой город или название.
                </p>
              ) : (
                visible.map((p, i) => (
                  <article
                    key={p.id}
                    className="property reveal"
                    style={{ "--d": `${Math.min(i, 5) * 70}ms` } as CSSProperties}
                  >
                    <ProductLink
                      href={productPath(p)}
                      className="property-image"
                      aria-label={`Подробнее: ${p.name}`}
                    >
                      <Image
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        width={640}
                        height={440}
                        sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw"
                        quality={75}
                      />
                      <span className="city-tag">{p.city}</span>
                      {p.projectPdf ? (
                        <span className="project-doc-tag">Есть проект</span>
                      ) : null}
                      <span className="image-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </ProductLink>
                    <div className="property-body">
                      <h3>
                        <ProductLink href={productPath(p)}>{p.name}</ProductLink>
                      </h3>
                      <p className="property-description">{p.description}</p>
                      <div className="property-bottom">
                        <span className="price">{money(p.price)}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {showMore ? (
              <div className="more-wrap">
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setExpanded(true)}
                >
                  Показать все комплексы <span>+</span>
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section about wrap" id="about">
          <div className="about-heading reveal">
            <p className="section-kicker">Центр недвижимости Дагестана</p>
            <h2>Кто мы?</h2>
            <div className="about-mark" aria-hidden="true">
              <svg viewBox="0 0 280 230" fill="none">
                <path
                  d="M20 210V110L80 70V210M80 210V40L145 10V210M145 210V80L220 40V210M220 210V120L260 100V210M10 210H270"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  d="M100 65V160M120 55V150M165 105V185M190 95V175"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
          <div className="about-copy reveal" style={{ "--d": "100ms" } as CSSProperties}>
            {content.about.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="founder-section">
          <div className="wrap founder">
            <div className="founder-portrait reveal">
              {content.founder.image ? (
                <Image
                  src={content.founder.image}
                  alt={content.founder.name}
                  loading="lazy"
                  width={720}
                  height={980}
                  sizes="(max-width: 560px) 100vw, 40vw"
                  quality={75}
                />
              ) : (
                <div className="no-photo" aria-hidden="true">
                  ЦНД
                </div>
              )}
            </div>
            <div className="founder-copy reveal" style={{ "--d": "120ms" } as CSSProperties}>
              <p className="section-kicker">{content.founder.role}</p>
              <h2>{content.founder.name}</h2>
              <p>{content.founder.bio}</p>
              <a className="text-link" href="#contacts">
                Познакомимся лично <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="section wrap" id="team">
          <div className="section-heading reveal">
            <div>
              <p className="section-kicker">Люди, которые рядом</p>
              <h2>Наши специалисты</h2>
            </div>
            <p className="team-intro">{content.teamDescription}</p>
          </div>
          <div className="team-grid">
            {content.team.map((person, i) => (
              <article
                key={person.name}
                className="person reveal"
                style={{ "--d": `${i * 80}ms` } as CSSProperties}
              >
                <Image
                  src={person.image}
                  alt={person.name}
                  loading="lazy"
                  width={320}
                  height={320}
                  sizes="(max-width: 800px) 45vw, 25vw"
                  quality={75}
                />
                <h3>{person.name}</h3>
                <p>{person.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section quiz-section reveal" id="quiz" aria-labelledby="quiz-heading">
          <div className="wrap quiz-layout">
            <div className="section-heading quiz-heading">
              <div>
                <p className="section-kicker">Индивидуальный подбор</p>
                <h2 id="quiz-heading">Подберём квартиру под ваш запрос</h2>
              </div>
              <p>
                {content.quizIntro}
              </p>
            </div>
            <QuizPanel />
          </div>
        </section>

        <section className="contacts wrap reveal" id="contacts">
          <div>
            <p className="section-kicker">Как с нами связаться?</p>
            <h2>
              Свяжитесь с нами
              <br />
              без промедления
            </h2>
            <a className="contact-phone" href={phoneLink}>
              {content.contacts.phone}
            </a>
            <a
              className="contact-email"
              href={`mailto:${content.contacts.email}`}
            >
              {content.contacts.email}
            </a>
          </div>
          <div className="contact-office">
            <span className="office-icon" aria-hidden="true">
              ⌖
            </span>
            <p>Будем рады видеть вас в офисе</p>
            <h3>
              г. Махачкала
              <br />
              5-я линия Акушинского 25
              <br />
              <span>2 этаж</span>
            </h3>
            <div className="socials">
              <a
                href={content.contacts.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                href={content.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
              <a
                href={content.contacts.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap footer">
        <a href="#" className="footer-brand">
          ЦНД <span>Недвижимость Дагестана</span>
        </a>
        <a href="#catalog">Наши дома</a>
        <a href="#about">О нас</a>
        <a href="#team">Сотрудники</a>
        <a href="#quiz">Подбор</a>
        <a href="#" className="back-top">
          Наверх ↑
        </a>
      </footer>
    </>
  );
}
