function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text, maxLen = 28, maxLines = 3) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length <= maxLen) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && (cur === lines[lines.length - 1])) {
    const last = lines[lines.length - 1];
    if (last.length > maxLen - 3) lines[lines.length - 1] = last.slice(0, maxLen - 3) + '...';
  }
  return lines;
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const title = String(req.query?.title || process.env.SITE_BUSINESS_NAME || 'Kadir Demir').slice(0, 120);
  const subtitle = String(req.query?.subtitle || req.query?.sub || 'YouTube içerik üreticisi').slice(0, 80);
  const tag = String(req.query?.tag || '').slice(0, 30);

  const lines = wrapLines(title, 26, 3);
  const lineHeight = 78;
  const titleStartY = 280;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050709"/>
      <stop offset="100%" stop-color="#0e1116"/>
    </linearGradient>
    <radialGradient id="glow1" cx="20%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="90%" cy="80%" r="55%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <g transform="translate(80,80)">
    <circle cx="22" cy="22" r="22" fill="url(#accent)"/>
    <text x="60" y="30" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="0.04em">${escapeXml((process.env.SITE_BUSINESS_NAME || 'Kadir Demir').toUpperCase())}</text>
  </g>

  ${tag ? `<g transform="translate(80,180)">
    <rect width="${Math.max(tag.length * 14 + 28, 80)}" height="36" rx="18" fill="rgba(45,212,191,0.18)" stroke="rgba(45,212,191,0.45)" stroke-width="1"/>
    <text x="${(tag.length * 14 + 28) / 2}" y="23" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" fill="#2dd4bf" letter-spacing="0.12em">${escapeXml(tag.toUpperCase())}</text>
  </g>` : ''}

  ${lines.map((line, i) => `<text x="80" y="${titleStartY + i * lineHeight}" font-family="Inter, system-ui, sans-serif" font-size="68" font-weight="800" fill="#ffffff" letter-spacing="-0.02em">${escapeXml(line)}</text>`).join('\n  ')}

  <text x="80" y="540" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="500" fill="#94a3b8" letter-spacing="-0.005em">${escapeXml(subtitle)}</text>

  <g transform="translate(80,580)">
    <rect width="80" height="3" rx="2" fill="url(#accent)"/>
    <text x="100" y="3" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" fill="#64748b" letter-spacing="0.1em">${escapeXml(new URL(process.env.SITE_BASE_URL || 'https://kadirardademir.com').hostname.toUpperCase())}</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=86400');
  return res.status(200).send(svg);
}
