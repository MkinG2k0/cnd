import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

function redirectFromNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data as {
    slug?: string;
    url?: string;
  };

  if (typeof data?.url === "string" && data.url) {
    router.push(data.url as never);
    return;
  }

  if (typeof data?.slug === "string" && data.slug) {
    router.push({
      pathname: "/zhk/[slug]",
      params: { slug: data.slug },
    });
  }
}

export function useNotificationObserver() {
  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();

    if (last?.notification) {
      redirectFromNotification(last.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        redirectFromNotification(response.notification);
      });

    return () => subscription.remove();
  }, []);
}
