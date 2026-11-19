// Purges Netlify's CDN cache for the whole site. It runs only when
// NETLIFY_PURGE_API_TOKEN and SITE_ID are set (Netlify provides both to the
// site's functions); elsewhere it does nothing.
export async function purgeCdn() {
  const token = process.env.NETLIFY_PURGE_API_TOKEN;
  const siteId = process.env.SITE_ID;
  if (!token || !siteId) return;
  try {
    const res = await fetch("https://api.netlify.com/api/v1/purge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId }),
    });
    if (!res.ok) console.error(`Netlify cache purge failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("Netlify cache purge failed.", err);
  }
}
