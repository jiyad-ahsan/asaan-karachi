// AsaanKarachi — static SEO page generator
// Runs at Netlify build time (see netlify.toml). Fetches live data from Supabase
// and writes category × area landing pages, category pages, a browse hub,
// sitemap.xml and robots.txt into site/.

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://qfblxaoudbtgvxmnxgee.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmx4YW91ZGJ0Z3Z4bW54Z2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzU0MTYsImV4cCI6MjA5OTM1MTQxNn0.DGOsOGSDItGPYXAwsVhsoqkKgSgq5RQZug3AZV98ABg";
const BASE_URL = "https://asaankarachi.pk";
const SITE_DIR = path.join(__dirname, "site");
// Swap this for the Google Form / native submission URL when ready:
const GET_LISTED_URL = "/get-listed.html";

const PLURALS = {
  "electrician": "Electricians",
  "plumber": "Plumbers",
  "ac-hvac-technician": "AC & HVAC Technicians",
  "generator-technician": "Generator Technicians",
  "appliance-repair": "Appliance Repair Services",
  "solar-services": "Solar Companies",
};

async function supa(pathAndQuery) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${pathAndQuery}: HTTP ${res.status}`);
  return res.json();
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stars(avg) {
  const r = Math.round(avg || 0);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function pageShell({ title, description, canonical, body, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" type="image/svg+xml" href="/logo.svg" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
<script>
(function () {
  var saved = localStorage.getItem("theme");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
})();
</script>
<link rel="stylesheet" href="/styles.css" />
</head>
<body>

<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="/"><img class="logo-img" src="/logo.svg" alt="" /> AsaanKarachi <span class="tag">Home Services Directory</span></a>
    <div class="header-right">
      <div class="header-sub">Serving areas across Karachi</div>
    </div>
  </div>
</header>

<main>
${body}
</main>

<footer class="site-footer">
  AsaanKarachi — community-rated home services directory for Karachi. Listings compiled from public sources; verify details with providers directly.
  · <a href="/browse/" style="color:inherit;text-decoration:underline">Browse all services by area</a>
  · <a href="/get-listed.html" style="color:inherit;text-decoration:underline">List your business</a>
</footer>

</body>
</html>
`;
}

function listingCard(l) {
  const areaNames = (l.listing_areas || []).map(la => la.areas?.name).filter(Boolean);
  const areaTags = areaNames.length >= 10
    ? `<span class="area-tag">🏙️ All Karachi</span>`
    : areaNames.slice(0, 3).map(a => `<span class="area-tag">${esc(a)}</span>`).join("") +
      (areaNames.length > 3 ? `<span class="area-tag">+${areaNames.length - 3} more</span>` : "");
  const wa = l.contact_whatsapp ? String(l.contact_whatsapp).replace(/[^0-9]/g, "").replace(/^0/, "") : null;
  return `
    <div class="card">
      <span class="badge">${esc(l.categories?.icon || "")} ${esc(l.categories?.name || "")}</span>
      <h3>${esc(l.business_name)}</h3>
      <div class="rating-row">
        <span class="stars">${stars(l.avg_rating)}</span>
        <span class="rating-count">${l.avg_rating ? l.avg_rating.toFixed(1) : "No ratings yet"}${l.review_count ? ` (${l.review_count} review${l.review_count === 1 ? "" : "s"})` : ""}</span>
      </div>
      ${l.google_rating ? `<div class="rating-row"><span class="rating-count">Google: ★ ${l.google_rating} (${l.google_review_count} reviews)</span></div>` : ""}
      <p class="card-desc">${esc(l.description || "")}</p>
      <div class="area-tags">${areaTags}</div>
      <div class="card-footer">
        <span class="meta-line">${l.years_experience ? l.years_experience + " yrs experience" : ""}</span>
        <div class="card-actions">
          ${l.contact_phone ? `<a class="btn secondary small" href="tel:${esc(l.contact_phone)}">📞 Call</a>` : ""}
          ${wa ? `<a class="btn secondary small" href="https://wa.me/92${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
          <a class="btn small" href="/listing.html?id=${l.id}">View profile</a>
        </div>
      </div>
    </div>`;
}

function comboIntro(catPlural, areaName, n, variant) {
  const v = [
    `Looking for reliable ${catPlural.toLowerCase()} in ${areaName}? AsaanKarachi lists ${n} trusted provider${n === 1 ? "" : "s"} serving ${areaName}, Karachi — with phone numbers, WhatsApp contact and community reviews, so you can hire with confidence.`,
    `Compare ${n} ${catPlural.toLowerCase()} serving ${areaName}, Karachi. Real contact details, service coverage and neighbour ratings — free to browse, no signup needed.`,
    `Need ${catPlural.toLowerCase()} in ${areaName}? Browse ${n} provider${n === 1 ? "" : "s"} rated by the Karachi community on AsaanKarachi. Call or WhatsApp them directly — no middleman, no fees.`,
  ];
  return v[variant % v.length];
}

function crossLinks(categories, areas, currentCat, currentArea) {
  const otherAreas = areas.filter(a => a.slug !== currentArea.slug)
    .map(a => `<a class="area-tag" href="/${currentCat.slug}/${a.slug}/">${esc(currentCat.plural)} in ${esc(a.name)}</a>`).join(" ");
  const otherCats = categories.filter(c => c.slug !== currentCat.slug)
    .map(c => `<a class="area-tag" href="/${c.slug}/${currentArea.slug}/">${esc(c.plural)} in ${esc(currentArea.name)}</a>`).join(" ");
  return `
  <h2 class="section-title">${esc(currentCat.plural)} in other areas</h2>
  <div class="area-tags" style="margin-bottom:20px">${otherAreas}</div>
  <h2 class="section-title">Other services in ${esc(currentArea.name)}</h2>
  <div class="area-tags">${otherCats}</div>`;
}

function ctaBlock(catName, areaName) {
  return `
  <div class="source-note" style="margin-top:28px">
    <strong>Are you a ${esc(catName.toLowerCase())} serving ${esc(areaName)}?</strong>
    <a href="${GET_LISTED_URL}" style="text-decoration:underline">Get listed on AsaanKarachi free</a> — reach customers searching for your service.
  </div>`;
}

async function main() {
  let categories, areas, listings, ratings;
  if (process.env.FIXTURES) {
    ({ categories, areas, listings, ratings } = JSON.parse(fs.readFileSync(process.env.FIXTURES, "utf8")));
  } else {
  [categories, areas, listings, ratings] = await Promise.all([
    supa("categories?select=id,name,slug,icon&order=name"),
    supa("areas?select=id,name,slug&order=name"),
    supa("listings?select=id,business_name,description,years_experience,contact_phone,contact_whatsapp,google_rating,google_review_count,categories(name,slug,icon),listing_areas(areas(name,slug))&status=eq.active&order=business_name"),
    supa("listing_ratings?select=*"),
  ]);
  }

  const ratingMap = {};
  for (const r of ratings) ratingMap[r.listing_id] = r;
  for (const l of listings) {
    l.avg_rating = ratingMap[l.id]?.avg_rating || 0;
    l.review_count = ratingMap[l.id]?.review_count || 0;
    l.areaSlugs = new Set((l.listing_areas || []).map(la => la.areas?.slug).filter(Boolean));
  }
  for (const c of categories) c.plural = PLURALS[c.slug] || c.name + "s";

  const contactTier = l => (l.contact_phone || l.contact_whatsapp) ? 2
    : (/\b[a-z0-9-]+\.(com|pk|org|net)\b/i.test(l.description || "") ? 1 : 0);
  const sortListings = arr => [...arr].sort((a, b) =>
    (contactTier(b) - contactTier(a)) ||
    (b.avg_rating - a.avg_rating) || (b.review_count - a.review_count) || a.business_name.localeCompare(b.business_name));

  const sitemapUrls = [`${BASE_URL}/`, `${BASE_URL}/browse/`];
  let pageCount = 0;

  // --- Category × Area pages ---
  categories.forEach((cat, ci) => {
    areas.forEach((area, ai) => {
      const matched = sortListings(listings.filter(l => l.categories?.slug === cat.slug && l.areaSlugs.has(area.slug)));
      const n = matched.length;
      const title = `${cat.plural} in ${area.name}, Karachi — Phone Numbers & Reviews | AsaanKarachi`;
      const description = `${cat.plural} serving ${area.name}, Karachi: ${n} provider${n === 1 ? "" : "s"} with contact numbers, WhatsApp and community reviews on AsaanKarachi.`;
      const canonical = `${BASE_URL}/${cat.slug}/${area.slug}/`;

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${cat.plural} in ${area.name}, Karachi`,
        "numberOfItems": n,
        "itemListElement": matched.map((l, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "LocalBusiness",
            "name": l.business_name,
            "url": `${BASE_URL}/listing.html?id=${l.id}`,
            "telephone": l.contact_phone || undefined,
            "areaServed": "Karachi, Pakistan",
            "description": l.description || undefined,
            ...(l.review_count > 0 ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": Number(l.avg_rating).toFixed(1),
                "reviewCount": l.review_count,
              }
            } : {}),
          },
        })),
      };

      const body = `
  <nav class="results-meta" style="margin-top:6px"><a href="/">Home</a> › <a href="/${cat.slug}/">${esc(cat.plural)}</a> › ${esc(area.name)}</nav>
  <section class="hero" style="text-align:left;padding:10px 0 4px">
    <h1>${esc(cat.plural)} in ${esc(area.name)}, Karachi</h1>
    <p style="margin:8px 0 0;max-width:720px">${esc(comboIntro(cat.plural, area.name, n, ci + ai))}</p>
  </section>
  <div class="results-meta">${n} service provider${n === 1 ? "" : "s"} found</div>
  <div class="listing-grid">${matched.map(listingCard).join("")}</div>
  ${ctaBlock(cat.name, area.name)}
  ${crossLinks(categories, areas, cat, area)}`;

      const dir = path.join(SITE_DIR, cat.slug, area.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), pageShell({ title, description, canonical, body, jsonLd }));
      sitemapUrls.push(canonical);
      pageCount++;
    });

    // --- Category hub page ---
    const catListings = sortListings(listings.filter(l => l.categories?.slug === cat.slug));
    const title = `${cat.plural} in Karachi — Compare ${catListings.length} Providers | AsaanKarachi`;
    const description = `Find ${cat.plural.toLowerCase()} in Karachi: ${catListings.length} providers with phone numbers, WhatsApp and community reviews. Filter by area on AsaanKarachi.`;
    const canonical = `${BASE_URL}/${cat.slug}/`;
    const areaLinks = areas.map(a => `<a class="area-tag" href="/${cat.slug}/${a.slug}/">${esc(a.name)}</a>`).join(" ");
    const body = `
  <nav class="results-meta" style="margin-top:6px"><a href="/">Home</a> › ${esc(cat.plural)}</nav>
  <section class="hero" style="text-align:left;padding:10px 0 4px">
    <h1>${esc(cat.plural)} in Karachi</h1>
    <p style="margin:8px 0 0;max-width:720px">Browse ${catListings.length} ${cat.plural.toLowerCase()} on AsaanKarachi — community-rated, with direct phone and WhatsApp contact. Pick your area below for providers near you.</p>
  </section>
  <h2 class="section-title">Choose your area</h2>
  <div class="area-tags" style="margin-bottom:24px">${areaLinks}</div>
  <div class="results-meta">${catListings.length} service provider${catListings.length === 1 ? "" : "s"}</div>
  <div class="listing-grid">${catListings.map(listingCard).join("")}</div>
  ${ctaBlock(cat.name, "Karachi")}`;
    fs.mkdirSync(path.join(SITE_DIR, cat.slug), { recursive: true });
    fs.writeFileSync(path.join(SITE_DIR, cat.slug, "index.html"), pageShell({ title, description, canonical, body }));
    sitemapUrls.push(canonical);
    pageCount++;
  });

  // --- Browse hub ---
  const browseBody = `
  <section class="hero" style="text-align:left;padding:10px 0 4px">
    <h1>Browse home services across Karachi</h1>
    <p style="margin:8px 0 0;max-width:720px">Every service and area we cover. Pick a combination to see providers with phone numbers and community reviews.</p>
  </section>
  ${categories.map(cat => `
  <h2 class="section-title"><a href="/${cat.slug}/">${esc(cat.icon || "")} ${esc(cat.plural)}</a></h2>
  <div class="area-tags" style="margin-bottom:16px">
    ${areas.map(a => `<a class="area-tag" href="/${cat.slug}/${a.slug}/">${esc(a.name)}</a>`).join(" ")}
  </div>`).join("")}`;
  fs.mkdirSync(path.join(SITE_DIR, "browse"), { recursive: true });
  fs.writeFileSync(path.join(SITE_DIR, "browse", "index.html"), pageShell({
    title: "Browse Home Services by Area — AsaanKarachi",
    description: "All home services on AsaanKarachi by Karachi area: electricians, plumbers, AC technicians, solar, generator and appliance repair.",
    canonical: `${BASE_URL}/browse/`,
    body: browseBody,
  }));
  pageCount++;

  // --- sitemap.xml ---
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(SITE_DIR, "sitemap.xml"), sitemap);

  // --- robots.txt ---
  fs.writeFileSync(path.join(SITE_DIR, "robots.txt"), `User-agent: *
Disallow: /admin.html
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`);

  console.log(`Generated ${pageCount} pages, sitemap (${sitemapUrls.length} URLs), robots.txt`);
}

main().catch(err => { console.error(err); process.exit(1); });
