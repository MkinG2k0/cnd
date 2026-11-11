import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ru.cnd05.app",
  appName: "ЦНД",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
