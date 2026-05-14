import { Helmet } from "react-helmet-async";

/* =========================================================
   ===================== SEO COMPONENT ======================
   ========================================================= */

export default function SEO({

  title = "EVSavari",

  description =
    "India's premium EV marketplace platform.",

  keywords =
    "EV India, electric cars, electric scooters, EV marketplace",

  canonical =
    "https://evsavari.com",

  image =
    "https://evsavari.com/og-banner.jpg",

  type = "website",

  robots = "index, follow",

  siteName = "EVSavari",

}) {

  return (

    <Helmet>

      {/* ================= BASIC SEO ================= */}

      <title>
        {title}
      </title>

      <meta
        name="description"
        content={description}
      />

      <meta
        name="keywords"
        content={keywords}
      />

      <meta
        name="robots"
        content={robots}
      />

      <link
        rel="canonical"
        href={canonical}
      />

      {/* ================= OPEN GRAPH ================= */}

      <meta
        property="og:title"
        content={title}
      />

      <meta
        property="og:description"
        content={description}
      />

      <meta
        property="og:image"
        content={image}
      />

      <meta
        property="og:type"
        content={type}
      />

      <meta
        property="og:url"
        content={canonical}
      />

      <meta
        property="og:site_name"
        content={siteName}
      />

      {/* ================= TWITTER ================= */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={title}
      />

      <meta
        name="twitter:description"
        content={description}
      />

      <meta
        name="twitter:image"
        content={image}
      />

    </Helmet>
  );
}