import {
  useEffect,
} from "react";

/* =========================================================
   ================== GOOGLE ANALYTICS =====================
   ========================================================= */

const GA_ID =
  import.meta.env.VITE_GA_ID;

export default function GoogleAnalytics() {

  useEffect(() => {

    if (
      !GA_ID ||
      typeof window === "undefined"
    ) {

      return;
    }

    if (window["__EVSAVARI_GA_INIT__"]) {

      return;
    }

    window["__EVSAVARI_GA_INIT__"] = true;

    const scriptSrc =
      document.createElement(
        "script"
      );

    scriptSrc.async = true;

    scriptSrc.src =
      `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

    document.head.appendChild(
      scriptSrc
    );

    const scriptInline =
      document.createElement(
        "script"
      );

    scriptInline.textContent =
      `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', ${JSON.stringify(GA_ID)});
    `;

    document.head.appendChild(
      scriptInline
    );

  }, []);

  return null;
}
