import type { QuizQuestion } from "./types";

export function whatsappURL(base: string, message: string) {
  const link = new URL(base);
  link.searchParams.set("text", message);
  return link.href;
}

export function isCustomOption(value: string) {
  return /^(Свой|Ваш) вариант$/.test(value);
}

function answerText(
  answers: string[][],
  customs: string[],
  index: number,
) {
  return (answers[index] || [])
    .map((value) =>
      isCustomOption(value) ? customs[index] || value : value,
    )
    .join(", ");
}

export function buildQuizMessage(input: {
  quiz: QuizQuestion[];
  answers: string[][];
  customs: string[];
  contactName: string;
  contactPhone: string;
  productName?: string;
}) {
  return [
    "Добрый день! Помогите подобрать квартиру.",
    input.productName ? `Интересует ЖК: ${input.productName}` : "",
    ...input.quiz.map(
      (q, i) => `${q.title} ${answerText(input.answers, input.customs, i)}`,
    ),
    input.contactName ? `ФИО: ${input.contactName}` : "",
    input.contactPhone ? `Телефон: ${input.contactPhone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
