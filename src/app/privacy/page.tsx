import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "../../lib/content";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Как приложение и сайт ЦНД обрабатывают контакты, избранное и push-уведомления.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="wrap" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <p className="section-kicker">{SITE_NAME}</p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 46px)", marginBottom: 28 }}>
        Политика конфиденциальности
      </h1>
      <div
        className="about-copy"
        style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.75 }}
      >
        <p style={{ color: "var(--ink)", marginBottom: 24 }}>
          Настоящая политика описывает обработку данных при использовании сайта
          cnd05.ru и мобильного приложения «ЦНД» для Android.
        </p>

        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "32px 0 12px" }}>
          Контакты и связь
        </h2>
        <p>
          При нажатии на телефон, WhatsApp или отправке заявки через квиз вы
          переходите во внешние приложения (звонок, мессенджер). Мы получаем
          только те сведения, которые вы сами передаёте в сообщении или при
          разговоре. Сайт и приложение не собирают содержимое переписки
          автоматически.
        </p>

        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "32px 0 12px" }}>
          Избранное в приложении
        </h2>
        <p>
          Список избранных жилых комплексов сохраняется локально на вашем
          устройстве. Эти данные не передаются на серверы ЦНД и не используются
          для профилирования.
        </p>

        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "32px 0 12px" }}>
          Push-уведомления
        </h2>
        <p>
          Если вы разрешите уведомления, приложение регистрирует push-токен
          (Expo/FCM) для доставки сообщений о новых объектах и акциях. Токен
          может храниться у провайдера push-сервиса. Отключить уведомления можно
          в настройках Android.
        </p>

        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "32px 0 12px" }}>
          Каталог и аналитика
        </h2>
        <p>
          Описания объектов и изображения загружаются из CMS Sanity по запросу
          приложения или браузера. Мы не продаём персональные данные третьим
          лицам.
        </p>

        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "32px 0 12px" }}>
          Вопросы
        </h2>
        <p>
          По вопросам обработки данных обращайтесь через контакты на главной
          странице сайта или в разделе «Контакты» приложения.
        </p>
      </div>
      <p style={{ marginTop: 40 }}>
        <Link href="/" className="text-link">
          ← На главную
        </Link>
      </p>
    </main>
  );
}
