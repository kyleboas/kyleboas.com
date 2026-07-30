const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

export async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const allowedOrigin = env.CORS_ORIGIN || 'https://kyleboas.com';
  const headers = { vary: 'Origin' };

  if (!origin || origin === allowedOrigin) {
    headers['access-control-allow-origin'] = origin || allowedOrigin;
  }
  headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
  headers['access-control-allow-headers'] = 'Content-Type, Accept';
  headers['access-control-max-age'] = '86400';
  return headers;
}

function response(request, env, body, status = 200) {
  const payload = status >= 400 && body.error && !body.code
    ? { ...body, code: body.error }
    : body;
  return json(payload, status, corsHeaders(request, env));
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function jsonField(value, fallback) {
  return JSON.stringify(value === undefined ? fallback : value);
}

function encodeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function newsletterPublicBaseUrl(env) {
  return env.NEWSLETTER_PUBLIC_BASE_URL || 'https://kyleboas.com';
}

function decodeXml(value) {
  return value.replace(/&(amp|lt|gt|quot|apos);/gi, (_match, entity) => ({
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  })[entity.toLowerCase()]).replace(/&#(x[0-9a-f]+|\d+);/gi, (match, entity) => {
    const codePoint = entity[0].toLowerCase() === 'x'
      ? Number.parseInt(entity.slice(1), 16)
      : Number.parseInt(entity, 10);
    const isValidCodePoint = Number.isInteger(codePoint)
      && codePoint >= 0
      && codePoint <= 0x10ffff
      && (codePoint < 0xd800 || codePoint > 0xdfff);
    return isValidCodePoint ? String.fromCodePoint(codePoint) : match;
  });
}

function xmlText(value) {
  if (!value) return null;
  const textValue = decodeXml(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'))
    .replace(/<[^>]*>/g, '')
    .trim();
  return textValue || null;
}

function xmlTag(entry, names) {
  for (const name of names) {
    const match = entry.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}\\s*>`, 'i'));
    const value = xmlText(match?.[1]);
    if (value) return value;
  }
  return null;
}

function xmlLink(entry) {
  const links = [...entry.matchAll(/<link\b([^>]*)>/gi)];
  const alternateLink = links.find(([, attributes]) => /\brel\s*=\s*["']alternate["']/i.test(attributes));
  const link = alternateLink || links.find(([, attributes]) => /\bhref\s*=/i.test(attributes));
  return xmlText(link?.[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]) || xmlTag(entry, ['link']);
}

function resolveFeedUrl(value, feedUrl) {
  if (!value) return null;
  try {
    return new URL(value, feedUrl).href;
  } catch {
    return value;
  }
}

function latestFeedItem(feed, feedUrl) {
  const entries = [...feed.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry\s*>/gi)];
  const items = entries.length ? entries : [...feed.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/gi)];
  const entry = items[0]?.[1];
  if (!entry) return null;

  return {
    title: xmlTag(entry, ['title']),
    url: resolveFeedUrl(xmlLink(entry), feedUrl),
    published_at: xmlTag(entry, ['published', 'pubDate', 'updated', 'date']),
    summary: xmlTag(entry, ['summary', 'description']),
  };
}

function wantsJson(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

function confirmationHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Subscription confirmed</title></head><body><main><h1>You’re subscribed.</h1><p>Your email has been confirmed for the Kyle Boas newsletter.</p></main></body></html>`;
}

async function sendConfirmation({ request, env, email, name, token, fetchFn }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const confirmationUrl = new URL('/api/newsletter/confirm', newsletterPublicBaseUrl(env));
  confirmationUrl.searchParams.set('token', token);
  const greeting = name ? `Hi ${encodeHtml(name)},` : 'Hi,';
  const html = `<p>${greeting}</p><p>Confirm your subscription to the Kyle Boas newsletter:</p><p><a href="${confirmationUrl.href}">Confirm subscription</a></p>`;
  const payload = {
    from: env.NEWSLETTER_FROM || 'Kyle Boas <newsletter@kyleboas.com>',
    to: [email],
    subject: 'Confirm your newsletter subscription',
    html,
    text: `${name ? `Hi ${name},\n\n` : ''}Confirm your subscription: ${confirmationUrl.href}`,
  };
  if (env.NEWSLETTER_REPLY_TO) payload.reply_to = env.NEWSLETTER_REPLY_TO;

  const resendResponse = await fetchFn(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resendResponse.ok) {
    throw new Error(`Resend returned ${resendResponse.status}`);
  }
}

async function parseSignup(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return { error: response(request, env, { error: 'invalid_json' }, 400) };
  }

  const email = normalizeEmail(payload?.email);
  if (!email) return { error: response(request, env, { error: 'invalid_email' }, 400) };
  if (payload?.consent?.newsletter !== true) {
    return { error: response(request, env, { error: 'consent_required' }, 400) };
  }

  return {
    email,
    name: text(payload.name),
    source: text(payload.source) || 'website',
    agentJson: jsonField(payload.agent, null),
    consentJson: jsonField(payload.consent, {}),
    tagsJson: jsonField(Array.isArray(payload.tags) ? payload.tags : [], []),
    metadataJson: jsonField(payload.metadata, {}),
  };
}

async function signup(request, env, fetchFn) {
  const parsed = await parseSignup(request, env);
  if (parsed.error) return parsed.error;

  const { email, name, source, agentJson, consentJson, tagsJson, metadataJson } = parsed;
  const db = env.NEWSLETTER_DB;
  const existing = await db.prepare(
    'SELECT email, status FROM newsletter_subscriptions WHERE email = ?'
  ).bind(email).first();

  if (existing?.status === 'subscribed') {
    return response(request, env, { status: 'already_subscribed', email });
  }

  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();

  if (existing) {
    await db.prepare(
      "UPDATE newsletter_subscriptions SET name = ?, source = ?, agent_json = ?, consent_json = ?, tags_json = ?, metadata_json = ?, token_hash = ?, updated_at = ? WHERE email = ? AND status = 'pending'"
    ).bind(name, source, agentJson, consentJson, tagsJson, metadataJson, tokenHash, now, email).run();
  } else {
    await db.prepare(
      'INSERT INTO newsletter_subscriptions (email, name, status, source, agent_json, consent_json, tags_json, metadata_json, token_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(email, name, 'pending', source, agentJson, consentJson, tagsJson, metadataJson, tokenHash, now, now).run();
  }

  try {
    await sendConfirmation({ request, env, email, name, token, fetchFn });
  } catch (error) {
    console.error('Newsletter confirmation email failed', error);
    return response(request, env, { error: 'email_send_failed', email }, 502);
  }

  return response(request, env, { status: 'confirmation_sent', email }, 202);
}

async function latest(request, env, fetchFn) {
  let feedUrl;
  try {
    feedUrl = new URL('/feed.xml', newsletterPublicBaseUrl(env)).href;
    const feedResponse = await fetchFn(feedUrl, {
      headers: { accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' },
    });
    if (!feedResponse.ok) {
      return response(request, env, { error: 'feed_unavailable' }, 502);
    }

    const item = latestFeedItem(await feedResponse.text(), feedUrl);
    if (!item) {
      return response(request, env, { error: 'no_newsletter_entries' }, 404);
    }
    return response(request, env, item);
  } catch (error) {
    console.error('Newsletter feed fetch failed', error);
    return response(request, env, { error: 'feed_unavailable' }, 502);
  }
}

async function confirm(request, env) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token || token.length > 512) {
    return response(request, env, { error: 'invalid_token' }, 400);
  }

  const tokenHash = await hashToken(token);
  const subscription = await env.NEWSLETTER_DB.prepare(
    "SELECT email FROM newsletter_subscriptions WHERE token_hash = ? AND status = 'pending'"
  ).bind(tokenHash).first();

  if (!subscription) {
    return response(request, env, { error: 'invalid_or_expired_token' }, 404);
  }

  const now = new Date().toISOString();
  await env.NEWSLETTER_DB.prepare(
    "UPDATE newsletter_subscriptions SET status = 'subscribed', confirmed_at = ?, updated_at = ?, token_hash = NULL WHERE email = ? AND status = 'pending'"
  ).bind(now, now, subscription.email).run();

  if (wantsJson(request)) {
    return response(request, env, { status: 'subscribed', email: subscription.email });
  }
  return new Response(confirmationHtml(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', ...corsHeaders(request, env) },
  });
}

export async function handleNewsletterRequest(request, env, fetchFn = fetch) {
  const url = new URL(request.url);
  const headers = corsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (url.pathname === '/api/newsletter/signup') {
    if (request.method !== 'POST') {
      return response(request, env, { error: 'method_not_allowed' }, 405);
    }
    return signup(request, env, fetchFn);
  }
  if (url.pathname === '/api/newsletter/confirm') {
    if (request.method !== 'GET') {
      return response(request, env, { error: 'method_not_allowed' }, 405);
    }
    return confirm(request, env);
  }
  if (url.pathname === '/api/newsletter/latest') {
    if (request.method !== 'GET') {
      return response(request, env, { error: 'method_not_allowed' }, 405);
    }
    return latest(request, env, fetchFn);
  }
  return response(request, env, { error: 'not_found' }, 404);
}
