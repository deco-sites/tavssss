import type { AnalyticsEvent } from "apps/commerce/types.ts";

export const sendEvent = <E extends AnalyticsEvent>(event: E) => {
  console.log(JSON.stringify(event, null, 2));
  globalThis.window.DECO.events.dispatch(event);
};

export const clickhouseScript = () => {


  const trackPageview = () => globalThis.window.DECO.events.dispatch({
      name: "pageview",
    })

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

    const mock = {
      hostname: window.location.origin,
      site_id: 12345,
      user_id: 67890,
      event_type: name,
      session_id: 12345,
      start_time: "2024-06-21T12:00:00Z", // ISO 8601 format for DateTime
      duration: 300, // Duration in seconds
      is_bounce: false,
      entry_page: "/home",
      exit_page: "/contact",
      exit_page_hostname: "example.com",
      pageviews: 5,
      events: 10,
      sign: 1,
      entry_meta: {
        key: ["device", "browser"],
        value: ["mobile", "chrome"],
      },
      utm_medium: "cpc",
      utm_source: "google",
      utm_campaign: "summer_sale",
      utm_content: "ad_variant_1",
      utm_term: "summer+sale+2024",
      referrer: "https://referrer.com",
      referrer_source: "search",
      country_code: "US", // ISO 3166-1 alpha-2
      subdivision1_code: "CA", // ISO 3166-2 (California)
      subdivision2_code: "LA", // LowCardinality representation
      city_geoname_id: 5368361, // GeoNames ID for Los Angeles
      screen_size: "1920x1080",
      operating_system: "Android",
      operating_system_version: "11",
      browser: "Chrome",
      browser_version: "91.0.4472.77",
      timestamp: "2024-06-21T12:05:00Z", // ISO 8601 format for DateTime
      transferred_from: "https://previous-site.com"
    }

    fetch("https://juggler.deco.site/live/invoke/site/actions/sendEvent.ts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: mock,
      }),
    })
  });

  // first pageview
  trackPageview()
};