import type { AnalyticsEvent } from "apps/commerce/types.ts";

export const sendEvent = <E extends AnalyticsEvent>(event: E) => {
  console.log(JSON.stringify(event, null, 2));
  globalThis.window.DECO.events.dispatch(event);
};

interface Props {
  siteId: number;
  siteName: string;
}

export const clickhouseScript = (props: Props) => {
  const trackPageview = () =>
    globalThis.window.DECO.events.dispatch({
      name: "pageview",
    });

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

    if (name === "deco") return;

    // get flags

    // Funções auxiliares para capturar informações dinâmicas
    function getDeviceType() {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return "mobile";
      if (/tablet/i.test(ua)) return "tablet";
      return "desktop";
    }

    function getBrowserName() {
      const ua = navigator.userAgent;
      if (/chrome|crios|crmo/i.test(ua)) return "Chrome";
      if (/firefox|fxios/i.test(ua)) return "Firefox";
      if (/safari/i.test(ua)) return "Safari";
      if (/msie|trident/i.test(ua)) return "Internet Explorer";
      if (/edge|edgios|edga/i.test(ua)) return "Edge";
      return "Unknown";
    }

    function getBrowserVersion() {
      const ua = navigator.userAgent;
      const browser = getBrowserName();
      let match;
      switch (browser) {
        case "Chrome":
          match = ua.match(/(?:chrome|crios|crmo)\/(\d+)/i);
          break;
        case "Firefox":
          match = ua.match(/(?:firefox|fxios)\/(\d+)/i);
          break;
        case "Safari":
          match = ua.match(/version\/(\d+)/i);
          break;
        case "Internet Explorer":
          match = ua.match(/(?:msie |rv:)(\d+)/i);
          break;
        case "Edge":
          match = ua.match(/(?:edge|edgios|edga)\/(\d+)/i);
          break;
      }
      return match ? match[1] : "Unknown";
    }

    function getOperatingSystem() {
      const ua = navigator.userAgent;
      if (/windows/i.test(ua)) return "Windows";
      if (/macintosh|mac os x/i.test(ua)) return "Mac OS";
      if (/linux/i.test(ua)) return "Linux";
      if (/android/i.test(ua)) return "Android";
      if (/ios|iphone|ipad|ipod/i.test(ua)) return "iOS";
      return "Unknown";
    }

    function getOSVersion() {
      const os = getOperatingSystem();
      const ua = navigator.userAgent;
      let match;
      switch (os) {
        case "Windows":
          match = ua.match(/Windows NT (\d+\.\d+)/);
          break;
        case "Mac OS":
          match = ua.match(/Mac OS X (\d+_\d+)/);
          break;
        case "Android":
          match = ua.match(/Android (\d+\.\d+)/);
          break;
        case "iOS":
          match = ua.match(/OS (\d+_\d+)/);
          break;
      }
      return match ? match[1].replace("_", ".") : "Unknown";
    }

    function getUrlParam(param: string) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }

    function getReferrerSource(referrer: string) {
      if (!referrer) return "direct";
      const referrerUrl = new URL(referrer);
      if (referrerUrl.hostname.includes("google")) return "google";
      if (referrerUrl.hostname.includes("facebook")) return "facebook";
      // Adicione outras fontes conforme necessário
      return "other";
    }

    const mock = {
      hostname: window.location.origin,
      site_id: props.siteId,
      site_name: props.siteName,
      user_id: undefined, // get server side
      session_id: undefined, // get server side
      event_name: name,
      start_time: new Date().toISOString(),
      timestamp: undefined, // get server side
      pathname: window.location.pathname,
      navigation_from: window.navigation.activation.from,
      entry_meta: {
        key: ["key"],
        value: ["value"],
      }, // fill with flags

      utm_medium: getUrlParam("utm_medium"),
      utm_source: getUrlParam("utm_source"),
      utm_campaign: getUrlParam("utm_campaign"),
      utm_content: getUrlParam("utm_content"),
      utm_term: getUrlParam("utm_term"),

      referrer: document.referrer,
      referrer_source: getReferrerSource(document.referrer), // benchmark: plausible

      ip_city: undefined, // get server side
      ip_continent: undefined, // get server side
      ip_country: undefined, // get server side
      ip_region: undefined, // get server side
      ip_region_code: undefined, // get server side
      ip_timezone: undefined, // get server side
      ip_lat: undefined, // get server side
      ip_long: undefined, // get server side

      screen_size: `${window.screen.width}x${window.screen.height}`,

      device: getDeviceType(),
      operating_system: getOperatingSystem(),
      operating_system_version: getOSVersion(),
      browser: getBrowserName(),
      browser_version: getBrowserVersion(),
    };

    fetch("https://juggler.deco.site/live/invoke/site/actions/sendEvent.ts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: mock,
      }),
    });
  });

  // first pageview
  trackPageview();
};
