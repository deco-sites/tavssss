import type { AnalyticsEvent } from "apps/commerce/types.ts";

export const sendEvent = <E extends AnalyticsEvent>(event: E) => {
  console.log(JSON.stringify(event, null, 2));
  globalThis.window.DECO.events.dispatch(event);
};

export const clickhouseScript = () => {
  // Flags and additional dimentions
  const props: Record<string, string> = {};

  const trackPageview = () =>
    globalThis.window.plausible?.("pageview", { props });

  // Attach pushState and popState listeners
  const originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      // @ts-ignore monkey patch
      originalPushState.apply(this, arguments);
      trackPageview();
    };
    addEventListener("popstate", trackPageview);
  }


  globalThis.window.DECO.events.subscribe((event) => {
    if (!event) return;

    const { name, params } = event;

    fetch("https://juggler.deco.site/live/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "site/actions/sendEvent.ts",
        props: {
          event: {
            event_type: name,
          },
        }
      }),
    })


    console.log("tavano", name)
  });
};