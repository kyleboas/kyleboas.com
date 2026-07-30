import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNewsletterRequest } from '../src/newsletter-core.js';

class MockD1 {
  rows = new Map();

  prepare(sql) {
    let values = [];
    return {
      bind: (...bound) => {
        values = bound;
        return this.prepareBound(sql, values);
      },
    };
  }

  prepareBound(sql, values) {
    return {
      first: async () => {
        if (sql.includes('WHERE email = ?')) return this.rows.get(values[0]) || null;
        if (sql.includes('WHERE token_hash = ?')) {
          return [...this.rows.values()].find(
            (row) => row.token_hash === values[0] && row.status === 'pending'
          ) || null;
        }
        throw new Error(`Unhandled first query: ${sql}`);
      },
      run: async () => {
        if (sql.startsWith('INSERT INTO newsletter_subscriptions')) {
          const [email, name, status, source, agent_json, consent_json, tags_json, metadata_json,
            token_hash, created_at, updated_at] = values;
          this.rows.set(email, { email, name, status, source, agent_json, consent_json, tags_json,
            metadata_json, token_hash, created_at, updated_at, confirmed_at: null });
          return { success: true };
        }
        if (sql.startsWith('UPDATE newsletter_subscriptions SET name')) {
          const [name, source, agent_json, consent_json, tags_json, metadata_json, token_hash,
            updated_at, email] = values;
          const row = this.rows.get(email);
          if (row?.status === 'pending') Object.assign(row, { name, source, agent_json, consent_json,
            tags_json, metadata_json, token_hash, updated_at });
          return { success: true };
        }
        if (sql.startsWith("UPDATE newsletter_subscriptions SET status = 'subscribed'")) {
          const [confirmed_at, updated_at, email] = values;
          const row = this.rows.get(email);
          if (row?.status === 'pending') {
            Object.assign(row, { status: 'subscribed', confirmed_at, updated_at, token_hash: null });
          }
          return { success: true };
        }
        throw new Error(`Unhandled run query: ${sql}`);
      },
    };
  }
}

function makeEnv(db = new MockD1()) {
  return {
    NEWSLETTER_DB: db,
    RESEND_API_KEY: 'test-key',
    NEWSLETTER_FROM: 'Kyle Boas <newsletter@kyleboas.com>',
  };
}

function signupRequest(body) {
  return new Request('https://kyleboas.com/api/newsletter/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('signup requires explicit newsletter consent', async () => {
  const response = await handleNewsletterRequest(
    signupRequest({ email: 'reader@example.com', consent: { newsletter: false } }),
    makeEnv()
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'consent_required', code: 'consent_required' });
});

test('signup rejects invalid email addresses', async () => {
  const response = await handleNewsletterRequest(
    signupRequest({ email: 'not-an-email', consent: { newsletter: true } }),
    makeEnv()
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_email', code: 'invalid_email' });
});

test('all error responses include a stable code', async () => {
  const response = await handleNewsletterRequest(
    new Request('https://kyleboas.com/api/newsletter/unknown'),
    makeEnv()
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'not_found', code: 'not_found' });
});

test('latest fetches and parses the newest static-site feed item', async () => {
  const env = makeEnv();
  env.NEWSLETTER_PUBLIC_BASE_URL = 'https://newsletter.example.test/with-a-trailing-slash/';
  let fetchedUrl;
  const response = await handleNewsletterRequest(
    new Request('https://kyleboas.com/api/newsletter/latest'),
    env,
    async (url) => {
      fetchedUrl = url;
      return new Response(`<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom"><entry>
          <title>Latest &amp; greatest</title>
          <link href="/posts/latest" rel="alternate" />
          <published>2025-03-04T12:00:00Z</published>
          <summary><![CDATA[<p>A short summary.</p>]]></summary>
        </entry></feed>`, { status: 200 });
    }
  );

  assert.equal(fetchedUrl, 'https://newsletter.example.test/feed.xml');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    title: 'Latest & greatest',
    url: 'https://newsletter.example.test/posts/latest',
    published_at: '2025-03-04T12:00:00Z',
    summary: 'A short summary.',
  });
});

test('latest reports stable errors when the feed is unavailable or empty', async () => {
  const unavailable = await handleNewsletterRequest(
    new Request('https://kyleboas.com/api/newsletter/latest'),
    makeEnv(),
    async () => new Response(null, { status: 503 })
  );
  assert.equal(unavailable.status, 502);
  assert.deepEqual(await unavailable.json(), { error: 'feed_unavailable', code: 'feed_unavailable' });

  const empty = await handleNewsletterRequest(
    new Request('https://kyleboas.com/api/newsletter/latest'),
    makeEnv(),
    async () => new Response('<rss><channel></channel></rss>', { status: 200 })
  );
  assert.equal(empty.status, 404);
  assert.deepEqual(await empty.json(), { error: 'no_newsletter_entries', code: 'no_newsletter_entries' });
});

test('signup stores a pending row and sends a Resend confirmation URL', async () => {
  const db = new MockD1();
  const sent = [];
  const response = await handleNewsletterRequest(
    signupRequest({ email: ' Reader@Example.com ', name: 'Reader', consent: { newsletter: true } }),
    makeEnv(db),
    async (url, options) => {
      sent.push({ url, options });
      return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
    }
  );

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { status: 'confirmation_sent', email: 'reader@example.com' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, 'https://api.resend.com/emails');
  assert.equal(sent[0].options.headers.authorization, 'Bearer test-key');
  const email = JSON.parse(sent[0].options.body);
  assert.equal(email.to[0], 'reader@example.com');
  const confirmationUrl = new URL(email.html.match(/href="([^"]+)"/)[1]);
  assert.equal(confirmationUrl.origin, 'https://kyleboas.com');
  assert.equal(confirmationUrl.pathname, '/api/newsletter/confirm');
  assert.ok(confirmationUrl.searchParams.get('token'));
  assert.equal(db.rows.get('reader@example.com').status, 'pending');
  assert.notEqual(db.rows.get('reader@example.com').token_hash, confirmationUrl.searchParams.get('token'));
});

test('NEWSLETTER_PUBLIC_BASE_URL overrides the confirmation URL origin', async () => {
  const env = makeEnv();
  env.NEWSLETTER_PUBLIC_BASE_URL = 'https://newsletter.example.test/with-a-trailing-slash/';
  let confirmationUrl;

  await handleNewsletterRequest(
    signupRequest({ email: 'reader@example.com', consent: { newsletter: true } }),
    env,
    async (_url, options) => {
      const email = JSON.parse(options.body);
      confirmationUrl = new URL(email.html.match(/href="([^"]+)"/)[1]);
      return new Response(null, { status: 200 });
    }
  );

  assert.equal(confirmationUrl.origin, 'https://newsletter.example.test');
  assert.equal(confirmationUrl.pathname, '/api/newsletter/confirm');
  assert.ok(confirmationUrl.searchParams.get('token'));
});

test('confirmation consumes the token and subscribes the pending row', async () => {
  const db = new MockD1();
  let confirmationUrl;
  const env = makeEnv(db);
  await handleNewsletterRequest(
    signupRequest({ email: 'reader@example.com', consent: { newsletter: true } }),
    env,
    async (_url, options) => {
      const email = JSON.parse(options.body);
      confirmationUrl = new URL(email.html.match(/href="([^"]+)"/)[1]);
      return new Response(null, { status: 200 });
    }
  );

  const response = await handleNewsletterRequest(
    new Request(confirmationUrl, { headers: { accept: 'application/json' } }),
    env
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'subscribed', email: 'reader@example.com' });
  const row = db.rows.get('reader@example.com');
  assert.equal(row.status, 'subscribed');
  assert.equal(row.token_hash, null);
  assert.ok(row.confirmed_at);
});
