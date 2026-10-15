import { router } from "expo-router";
import { useEffect } from "react";

import { getNotifications } from "./module";

function redirectFromNotification(notification: {
  request: { content: { data?: Record<string, unknown> } };
}) {
  const data = notification.request.content.data as
    | {
        slug?: string;
        url?: string;
      }
    | undefined;

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
    const Notifications = getNotifications();
    if (!Notifications) {
      return;
    }

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
