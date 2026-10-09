const SECTION_RE =
  /^(о доме|о районе|условия|о комплексе|инфраструктура|преимущества|локация|паркровка|двор|почему выбирают[^:]*)\s*:?\s*$/i;

const LABEL_LINE_RE =
  /^(срок сдачи|технология строительства|масштаб проекта|квартирный фонд|тип дома|этажей в доме|пассажирский лифт|грузовой лифт|двор|парковка|расположение)\s*:\s*(.+)$/i;

function decodeEntities(html: string) {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string) {
  return decodeEntities(html)
    .replace(/<\/?(strong|b)>/gi, "§")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u200b|\u2060|\ufeff/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMostlyUpper(text: string) {
  const letters = text.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  if (letters.length < 8) return false;
  const upper = letters.replace(/[^A-ZА-ЯЁ]/g, "").length;
  return upper / letters.length >= 0.72;
}

function fixAcronyms(text: string) {
  return text
    .replace(/(^|[^\p{L}\p{N}])Жк(?=[^\p{L}\p{N}]|$)/gu, "$1ЖК")
    .replace(/(^|[^\p{L}\p{N}])жк(?=[^\p{L}\p{N}]|$)/gu, "$1ЖК")
    .replace(/(^|[^\p{L}\p{N}])Сз(?=[^\p{L}\p{N}]|$)/gu, "$1СЗ")
    .replace(/(^|[^\p{L}\p{N}])Пао(?=[^\p{L}\p{N}]|$)/gu, "$1ПАО")
    .replace(/(^|[^\p{L}\p{N}])Фз(?=[^\p{L}\p{N}]|$)/gu, "$1ФЗ")
    .replace(/(^|[^\p{L}\p{N}])Iq(?=[^\p{L}\p{N}]|$)/gu, "$1IQ")
    .replace(/"([^"]+)"/g, "«$1»")
    .replace(/«(\p{Ll})/gu, (_, ch: string) => `«${ch.toLocaleUpperCase("ru-RU")}`);
}

function upperRatio(text: string) {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (letters.length < 6) return 0;
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  return upper / letters.length;
}

function needsCaseFix(text: string) {
  return (
    isMostlyUpper(text) ||
    upperRatio(text) >= 0.45 ||
    /[А-ЯЁA-Z]{5,}/.test(text)
  );
}

function toSentenceCase(text: string) {
  if (!needsCaseFix(text)) return fixAcronyms(text);
  const lower = text.toLocaleLowerCase("ru-RU");
  const cased = lower.replace(
    /(^|[.!?…]\s+|:\s+)(\S)/g,
    (_, prefix: string, ch: string) => prefix + ch.toLocaleUpperCase("ru-RU"),
  );
  return fixAcronyms(cased);
}

function titleCaseHeading(text: string) {
  const lower = text.toLocaleLowerCase("ru-RU");
  return fixAcronyms(
    lower.charAt(0).toLocaleUpperCase("ru-RU") + lower.slice(1),
  );
}

function cleanLine(raw: string) {
  let line = raw
    .replace(/§/g, "")
    .replace(/^[\s•●▪◦·\*\-–—✔️✅☑️🔵🔷🟤🏆💵📞🌳🚶🔌🏫]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
  line = line.replace(/;+$/g, "");
  return toSentenceCase(line);
}

function isSectionHeader(line: string) {
  const t = line.replace(/:$/, "").trim();
  if (SECTION_RE.test(t)) return true;
  const compact = t.replace(/\s+/g, "");
  if (
    compact.length <= 24 &&
    isMostlyUpper(t) &&
    !/[.!?]/.test(t) &&
    /^(о |условия|инфраструктура|преимущества|локация|старт)/i.test(t)
  ) {
    return true;
  }
  return false;
}

function looksLikeListItem(line: string, inList: boolean) {
  if (!line || line.length > 140) return false;
  if (LABEL_LINE_RE.test(line)) return false;
  if (isSectionHeader(line)) return false;
  if (/[.;]$/.test(line) && line.length < 110) return true;
  if (inList && line.length < 95 && !/[.!?]$/.test(line)) return true;
  if (/^(от |до |есть |полный |гибкая |актуальн)/i.test(line) && line.length < 80) {
    return true;
  }
  return false;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "dl"; items: { label: string; value: string }[] };

/**
 * Turns messy Tilda-era detail HTML into uniform semantic markup
 * shared by the catalog modal and /zhk pages.
 */
export function formatPropertyDetail(detailHtml: string) {
  const plain = stripTags(detailHtml || "");
  if (!plain) return "";

  const rawLines = plain
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Block[] = [];
  let list: string[] = [];
  let defs: { label: string; value: string }[] = [];
  let inList = false;

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
    inList = false;
  };

  const flushDefs = () => {
    if (defs.length) {
      blocks.push({ type: "dl", items: defs });
      defs = [];
    }
  };

  for (const raw of rawLines) {
    const line = cleanLine(raw);
    if (!line) continue;

    const labelMatch = line.match(LABEL_LINE_RE);
    if (labelMatch) {
      flushList();
      defs.push({
        label: toSentenceCase(labelMatch[1]),
        value: toSentenceCase(labelMatch[2].trim()),
      });
      continue;
    }

    if (isSectionHeader(line)) {
      flushList();
      flushDefs();
      const title = line.replace(/:$/, "").trim();
      blocks.push({ type: "h", text: titleCaseHeading(title) });
      inList = true;
      continue;
    }

    if (looksLikeListItem(line, inList) || (inList && line.length < 100)) {
      flushDefs();
      list.push(line);
      inList = true;
      continue;
    }

    flushList();
    flushDefs();
    if (line.length > 260) {
      const sentences = line.split(/(?<=[.!?…])\s+/).filter(Boolean);
      if (sentences.length > 1) {
        let chunk = "";
        for (const sentence of sentences) {
          const next = chunk ? `${chunk} ${sentence}` : sentence;
          if (chunk && next.length > 220) {
            blocks.push({ type: "p", text: chunk });
            chunk = sentence;
          } else {
            chunk = next;
          }
        }
        if (chunk) blocks.push({ type: "p", text: chunk });
        inList = false;
        continue;
      }
    }
    blocks.push({ type: "p", text: line });
    inList = false;
  }

  flushList();
  flushDefs();

  // Merge consecutive short ALL-CAPS-turned paragraphs into a list
  // when they look like feature chips (e.g. Высота).
  const normalized: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (
      b.type === "p" &&
      b.text.length < 70 &&
      !/[.!?]$/.test(b.text) &&
      blocks[i + 1]?.type === "p" &&
      (blocks[i + 1] as { text: string }).text.length < 70
    ) {
      const items = [b.text];
      while (
        i + 1 < blocks.length &&
        blocks[i + 1].type === "p" &&
        (blocks[i + 1] as { text: string }).text.length < 70 &&
        !/[.!?]$/.test((blocks[i + 1] as { text: string }).text)
      ) {
        i++;
        items.push((blocks[i] as { text: string }).text);
      }
      const last = items[items.length - 1];
      if (/[.!?]$/.test(last) && items.length > 2) {
        items.pop();
        normalized.push({ type: "ul", items });
        normalized.push({ type: "p", text: last });
      } else if (items.length >= 3) {
        normalized.push({ type: "ul", items });
      } else {
        for (const t of items) normalized.push({ type: "p", text: t });
      }
      continue;
    }
    normalized.push(b);
  }

  // Merge adjacent lists and promote a lone complex-name list opener to a paragraph.
  const merged: Block[] = [];
  for (const b of normalized) {
    const prev = merged[merged.length - 1];
    if (b.type === "ul" && prev?.type === "ul") {
      prev.items.push(...b.items);
      continue;
    }
    if (
      b.type === "ul" &&
      b.items.length >= 2 &&
      /^(жилой комплекс|жк «|жк ")/i.test(b.items[0]) &&
      b.items[0].length < 50
    ) {
      merged.push({ type: "p", text: b.items[0] });
      merged.push({ type: "ul", items: b.items.slice(1) });
      continue;
    }
    merged.push(b);
  }

  return merged
    .map((b) => {
      if (b.type === "p") return `<p>${escapeHtml(b.text)}</p>`;
      if (b.type === "h") return `<h3>${escapeHtml(b.text)}</h3>`;
      if (b.type === "ul") {
        return `<ul>${b.items
          .map((item) => {
            const normalized = toSentenceCase(item);
            const capped =
              normalized.charAt(0).toLocaleUpperCase("ru-RU") +
              normalized.slice(1);
            return `<li>${escapeHtml(fixAcronyms(capped))}</li>`;
          })
          .join("")}</ul>`;
      }
      return `<dl>${b.items
        .map(
          (item) =>
            `<div><dt>${escapeHtml(titleCaseHeading(item.label))}</dt><dd>${escapeHtml(item.value.replace(/\.$/, ""))}</dd></div>`,
        )
        .join("")}</dl>`;
    })
    .join("");
}
