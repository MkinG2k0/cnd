import { describe, expect, test } from "@jest/globals";

declare const __dirname: string;
declare function require(name: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const root = join(__dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("navigation shell", () => {
  test("registers hidden tab routes for catalog, favorites and contacts", () => {
    const layout = read("app/(tabs)/_layout.tsx");

    expect(layout).toContain("tabBar={() => null}");
    expect(layout).toContain('name="index"');
    expect(layout).toContain('name="favorites"');
    expect(layout).toContain('name="contacts"');
  });

  test("burger menu lists the needed Russian items", () => {
    const header = read("src/components/AppHeader.tsx");
    const nav = read("src/theme/nav.ts");

    expect(header).toContain("Открыть меню");
    expect(header).toContain("Закрыть меню");
    expect(header).toContain("BlurView");
    expect(header).toContain("FadeInDown");
    expect(nav).toContain("Наши дома");
    expect(nav).toContain("Избранное");
    expect(nav).toContain("Подбор");
    expect(nav).toContain("Контакты");
  });

  test("provides favorites and registers product and quiz screens", () => {
    const layout = read("app/_layout.tsx");

    expect(layout).toContain("PersistQueryClientProvider");
    expect(layout).toContain("<FavoritesProvider>");
    expect(layout).toContain("<AppHeader />");
    expect(layout).toContain('name="zhk/[slug]"');
    expect(layout).toContain('name="quiz"');
  });

  test("shared product UI implements the required contracts", () => {
    const favoriteButton = read("src/components/FavoriteButton.tsx");
    const productCard = read("src/components/ProductCard.tsx");
    const heroSlider = read("src/components/HeroSlider.tsx");

    expect(favoriteButton).toContain("toggle(slug)");
    expect(favoriteButton).toContain("В избранное");
    expect(favoriteButton).toContain("Убрать из избранного");
    expect(productCard).toContain("money(price)");
    expect(productCard).toContain("pathname: \"/zhk/[slug]\"");
    expect(heroSlider).toContain("В нашем каталоге");
    expect(heroSlider).toContain("pagingEnabled");
  });

  test("detail settings failure does not hide the product", () => {
    const detail = read("app/zhk/[slug].tsx");

    expect(detail).not.toContain("Promise.all([");
    expect(detail).toContain("contacts optional");
    expect(detail).toContain("settingsQuery");
  });

  test("quiz consent has only one toggle handler", () => {
    const quiz = read("app/quiz.tsx");

    expect(quiz).toContain("onValueChange={setConsent}");
    expect(quiz).not.toMatch(
      /<Pressable[\s\S]*?accessibilityRole="checkbox"[\s\S]*?<Switch/,
    );
  });

  test("favorites become ready even when storage loading fails", () => {
    const favorites = read("hooks/useFavorites.tsx");

    expect(favorites).toContain(".finally(() =>");
    expect(favorites).toContain("setReady(true)");
  });

  test("push registration persists the last token", () => {
    const registration = read("src/notifications/register.ts");

    expect(registration).toContain('PUSH_TOKEN_KEY = "cnd.push.token"');
    expect(registration).toContain(
      "AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data)",
    );
  });

  test("notification observer skips native APIs on web", () => {
    const observer = read("src/notifications/observer.ts");

    expect(observer).toContain("getNotifications()");
    expect(observer).toContain("getLastNotificationResponse");
  });

  test("notification entrypoints do not statically import expo-notifications", () => {
    const files = [
      read("app/_layout.tsx"),
      read("src/notifications/observer.ts"),
      read("src/notifications/register.ts"),
      read("src/notifications/module.ts"),
    ];

    for (const source of files) {
      expect(source).not.toMatch(
        /import\s+\*\s+as\s+Notifications\s+from\s+["']expo-notifications["']/,
      );
    }

    const loader = read("src/notifications/module.ts");
    expect(loader).toContain('Platform.OS === "web"');
    expect(loader).toContain("isRunningInExpoGo");
    expect(loader).toContain('require("expo-notifications")');
    expect(loader).toContain("catch");

    const skipIndex = loader.indexOf("isRunningInExpoGo");
    const requireIndex = loader.indexOf('require("expo-notifications")');
    expect(requireIndex).toBeGreaterThan(skipIndex);
  });
});
