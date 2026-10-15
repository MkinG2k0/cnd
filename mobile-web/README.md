# ЦНД — Android WebView

Нативное Android-приложение: полноэкранный WebView сайта https://cnd-kohl.vercel.app/

- applicationId: `ru.cnd05.web`
- minSdk 24 / targetSdk 35

## Открыть в Android Studio

1. File → Open → папка `mobile-web`
2. Дождаться синхронизации Gradle
3. Run на эмуляторе или устройстве

## Сборка из терминала

```bash
cd mobile-web
.\gradlew.bat assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`
