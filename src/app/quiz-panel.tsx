"use client";

import Image from "next/image";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  isCustomOption,
  whatsappURL,
  type QuizQuestion,
} from "../lib/content";

export function QuizPanel({
  quiz,
  whatsapp,
}: {
  quiz: QuizQuestion[];
  whatsapp: string;
}) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [customs, setCustoms] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [draftAnswers, setDraftAnswers] = useState<string[]>([]);
  const [draftCustom, setDraftCustom] = useState("");

  const totalSteps = quiz.length + 1;
  const isLast = step === quiz.length;
  const question = !isLast ? quiz[step] : null;

  useEffect(() => {
    if (isLast) return;
    setDraftAnswers(answers[step] || []);
    setDraftCustom(customs[step] || "");
    setError("");
  }, [step, isLast, answers, customs]);

  function answerText(index: number) {
    return (answers[index] || [])
      .map((value) =>
        isCustomOption(value) ? customs[index] || value : value,
      )
      .join(", ");
  }

  function toggleAnswer(value: string, multi: boolean) {
    setDraftAnswers((prev) => {
      if (multi) {
        return prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
      }
      return [value];
    });
  }

  function goBack() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isLast) {
      if (!draftAnswers.length) {
        setError("Выберите подходящий вариант.");
        return;
      }
      if (draftAnswers.some(isCustomOption) && !draftCustom.trim()) {
        setError("Напишите свой вариант ответа.");
        return;
      }
      const nextAnswers = [...answers];
      const nextCustoms = [...customs];
      nextAnswers[step] = draftAnswers;
      nextCustoms[step] = draftCustom.trim();
      setAnswers(nextAnswers);
      setCustoms(nextCustoms);
      setStep((s) => s + 1);
      return;
    }

    if (!consent) {
      setError("Подтвердите передачу ответов в WhatsApp.");
      return;
    }
    if (contactPhone && !/^[+\d\s()\-]{7,25}$/.test(contactPhone)) {
      setError("Проверьте номер телефона.");
      return;
    }

    const message = [
      "Добрый день! Помогите подобрать квартиру.",
      ...quiz.map((q, i) => `${q.title} ${answerText(i)}`),
      contactName ? `ФИО: ${contactName}` : "",
      contactPhone ? `Телефон: ${contactPhone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      whatsappURL(whatsapp, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  const hasCustom = question?.options.some(isCustomOption) ?? false;
  const customSelected = draftAnswers.some(isCustomOption);

  return (
    <div className="quiz-panel">
      <div className="quiz-top">
        <span>Подбор квартиры</span>
        <span>
          {step + 1} / {totalSteps}
        </span>
      </div>
      <div className="progress-track">
        <div
          style={{
            width: "100%",
            transform: `scaleX(${(step + 1) / totalSteps})`,
          }}
        />
      </div>
      <form onSubmit={onSubmit}>
        <div>
          {isLast ? (
            <>
              <h3 id={titleId} className="quiz-step-title">
                Обсудим вашу квартиру
              </h3>
              <div className="quiz-summary">
                {quiz.map((q, i) => (
                  <p key={q.title}>
                    <b>{q.title}</b>
                    <br />
                    {answerText(i)}
                  </p>
                ))}
              </div>
              <label className="contact-field">
                ФИО <span>(необязательно)</span>
                <input
                  autoComplete="name"
                  maxLength={100}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </label>
              <label className="contact-field">
                Номер телефона <span>(необязательно)</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={25}
                  placeholder="+7"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Я согласен передать введённые данные менеджеру через WhatsApp.
              </label>
              <p className="quiz-help">
                Кнопка откроет WhatsApp с вашими ответами. Проверьте сообщение и
                отправьте его самостоятельно. До этого заявка не отправляется.
                Данные анкеты не сохраняются на этом сайте.
              </p>
            </>
          ) : question ? (
            <>
              <h3 id={titleId} className="quiz-step-title" tabIndex={-1}>
                {question.title}
              </h3>
              {step === 2 ? (
                <p className="quiz-help">
                  Отметьте один или несколько вариантов
                </p>
              ) : null}
              <div className="quiz-options">
                {question.options.map((value, index) => (
                  <label key={value} className="quiz-option">
                    <input
                      type={step === 2 ? "checkbox" : "radio"}
                      name="answer"
                      value={value}
                      checked={draftAnswers.includes(value)}
                      onChange={() => toggleAnswer(value, step === 2)}
                    />
                    {value}
                    {question.images?.[index] ? (
                      <Image
                        src={question.images[index]}
                        alt=""
                        loading="lazy"
                        width={74}
                        height={58}
                        sizes="74px"
                        quality={75}
                      />
                    ) : null}
                  </label>
                ))}
              </div>
              {hasCustom ? (
                <input
                  className="quiz-custom"
                  aria-label="Свой вариант ответа"
                  placeholder="Свой вариант ответа"
                  maxLength={200}
                  value={draftCustom}
                  hidden={!customSelected}
                  onChange={(e) => setDraftCustom(e.target.value)}
                />
              ) : null}
            </>
          ) : null}
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="form-error" />
        )}
        <div className="quiz-actions">
          <button
            type="button"
            className="button outline"
            disabled={step === 0}
            onClick={goBack}
          >
            Назад
          </button>
          <button type="submit" className="button">
            {isLast ? (
              <>
                Открыть WhatsApp <span aria-hidden="true">↗</span>
              </>
            ) : (
              <>
                Далее <span aria-hidden="true">↗</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
