import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ru.cnd05.app",
  appName: "ЦНД",
  webDir: "out",
  server: {
    androidScheme: "https",
    hostname: "localhost",
    allowNavigation: [
      "cnd-kohl.vercel.app",
      "cnd05.ru",
      "cdn.sanity.io",
      "cdn.jsdelivr.net",
      "media.githubusercontent.com",
      "mozilla.github.io",
    ],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#ffffff",
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
