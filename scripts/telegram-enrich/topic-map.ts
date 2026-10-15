export const TOPIC_MAP: Record<string, string> = {
  "ЖК Новый горизонт": "ЖК Новый Горизонт",
  "ЖК Московский": "ЖК Московский",
  "ЖкК высота": "ЖК Высота",
  "СК ЖБИ": "ЖК Мечта",
  "ЖК Август": "ЖК Август",
  "Жк Сите": "ЖК Сите",
  "Жк Гранд Берег - СК Унистрой": "ЖК Грандберег",
  "ЖК Ботаника - СК АРДВ": "ЖК Ботаника",
  "СК Аркадий СТ - Золотые пески - Новая жизнь": "ЖК Золотые Пески",
};

export function resolveProductName(topicTitle: string): string | null {
  return TOPIC_MAP[topicTitle] ?? null;
}

export function shouldSkipArcadaMessage(text: string): boolean {
  const t = text.toLowerCase();
  const mentionsNewLife = t.includes("новая жизнь");
  const mentionsGold = t.includes("золотые пески");
  return mentionsNewLife && !mentionsGold;
}
