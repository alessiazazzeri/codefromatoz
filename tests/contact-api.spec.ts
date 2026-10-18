import { test, expect } from "@playwright/test";
import {
  onRequestGet,
  onRequestPost,
  type ContactEnv,
} from "../functions/api/contact";
function fixture() {
  const store = new Map<string, string>();
  const env: ContactEnv = {
    GOOGLE_CLIENT_ID: "test-client",
    GOOGLE_CLIENT_SECRET: "test-secret",
    GOOGLE_REFRESH_TOKEN: "test-refresh",
    CONTACT_FORM_SECRET: "test-only-signing-secret-at-least-32-characters",
    CONTACT_RATE_LIMIT: {
      async get(key) {
        return store.get(key) ?? null;
      },
      async put(key, value) {
        store.set(key, value);
      },
    },
  };
  return { env, store };
}
async function token(env: ContactEnv) {
  const now = Date.now;
  Date.now = () => now() - 3000;
  try {
    return (
      (await (
        await onRequestGet({
          env,
          request: new Request("https://portfolio.example/api/contact"),
        })
      ).json()) as { token: string }
    ).token;
  } finally {
    Date.now = now;
  }
}
const valid = {
  name: "Alè Test",
  email: "test@example.com",
  need: "Non lo so ancora",
  project: "Una richiesta di prova. Nessuna email reale.",
  privacy: true,
  honeypot: "",
};
function request(body: object, origin = "https://portfolio.example") {
  return new Request("https://portfolio.example/api/contact", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: JSON.stringify(body),
  });
}
test("server: successo solo dopo conferma Gmail, MIME e credenziali solo server", async () => {
  const { env } = fixture();
  const challenge = await token(env);
  const original = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(
      JSON.stringify(
        String(input).includes("oauth2")
          ? { access_token: "test-access" }
          : { id: "test-message-id" },
      ),
      { status: 200 },
    );
  };
  try {
    const result = await onRequestPost({
      env,
      request: request({ ...valid, token: challenge }),
    });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(calls.map(call => call.url)).toEqual([
      'https://oauth2.googleapis.com/token',
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    ]);
    expect(new URLSearchParams(calls[0].init!.body as URLSearchParams).get('grant_type')).toBe('refresh_token');
    expect(calls[1].init!.method).toBe('POST');
    expect(calls[1].init!.headers).toMatchObject({ Authorization: 'Bearer test-access', 'Content-Type': 'application/json' });
    const body = JSON.parse(calls[1].init!.body as string);
    expect(Object.keys(body)).toEqual(['raw']);
    expect(body.raw).toMatch(/^[A-Za-z0-9_-]+$/);
    const mime = Buffer.from(body.raw, "base64url").toString("utf8");
    expect(mime).toContain("From: info@codefromatoz.it");
    expect(mime).toContain("To: info@codefromatoz.it");
    expect(mime).toContain("Reply-To: test@example.com");
    const text = Buffer.from(mime.split("\r\n\r\n")[1], "base64").toString(
      "utf8",
    );
    expect(text).toContain("Alè Test");
    expect(text).toContain(valid.project);
    const repeat = await onRequestPost({
      env,
      request: request({ ...valid, token: challenge }),
    });
    expect(repeat.status).toBe(409);
    expect(calls).toHaveLength(2);
  } finally {
    globalThis.fetch = original;
  }
});
test("server: campi invalidi, presa visione privacy, opzioni arbitrarie e header injection", async () => {
  const { env, store } = fixture();
  const challenge = await token(env);
  const result = await onRequestPost({
    env,
    request: request({
      ...valid,
      token: challenge,
      name: " ",
      email: "evil@example.com\r\nBcc:x@example.com",
      need: "invented",
      project: "",
      privacy: false,
    }),
  });
  expect(result.status).toBe(422);
  const body = (await result.json()) as { fields: Record<string, string> };
  expect(Object.keys(body.fields)).toEqual([
    "name",
    "email",
    "need",
    "project",
    "privacy",
  ]);
  expect(body.fields.privacy).toBe("Conferma di aver letto l’informativa privacy.");
  expect(store.size).toBe(0);
});
test("server: origine, token contraffatto, honeypot, payload e configurazione", async () => {
  const { env } = fixture();
  const challenge = await token(env);
  expect(
    (
      await onRequestPost({
        env,
        request: request(
          { ...valid, token: challenge },
          "https://other.example",
        ),
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await onRequestPost({
        env,
        request: request({ ...valid, token: challenge + "x" }),
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await onRequestPost({
        env,
        request: request({ ...valid, token: challenge, honeypot: "spam" }),
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await onRequestPost({
        env,
        request: request({
          ...valid,
          token: challenge,
          project: "x".repeat(17000),
        }),
      })
    ).status,
  ).toBe(413);
  expect(
    (
      await onRequestGet({
        env: { ...env, GOOGLE_REFRESH_TOKEN: "" },
        request: new Request("https://portfolio.example/api/contact"),
      })
    ).status,
  ).toBe(503);
  expect(
    (
      await onRequestPost({
        env: { ...env, GOOGLE_REFRESH_TOKEN: "" },
        request: request(valid),
      })
    ).status,
  ).toBe(503);
});
test("server: token appena emesso e scaduto", async () => {
  const { env } = fixture();
  const req = new Request("https://portfolio.example/api/contact");
  const fresh = (await (await onRequestGet({ env, request: req })).json()) as {
    token: string;
  };
  expect(
    (
      await onRequestPost({
        env,
        request: request({ ...valid, token: fresh.token }),
      })
    ).status,
  ).toBe(403);
  const challenge = await token(env);
  const now = Date.now;
  Date.now = () => now() + 3700000;
  try {
    expect(
      (
        await onRequestPost({
          env,
          request: request({ ...valid, token: challenge }),
        })
      ).status,
    ).toBe(403);
  } finally {
    Date.now = now;
  }
});
test("server: errori Google e limite KV senza chiamate aggiuntive", async () => {
  const { env } = fixture();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response("{}", { status: 500 });
  };
  try {
    for (let i = 0; i < 5; i++) {
      const challenge = await token(env);
      expect(
        (
          await onRequestPost({
            env,
            request: request({ ...valid, token: challenge }),
          })
        ).status,
      ).toBe(502);
    }
    const challenge = await token(env);
    const limited = await onRequestPost({
      env,
      request: request({ ...valid, token: challenge }),
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("3600");
    expect(calls).toBe(5);
  } finally {
    globalThis.fetch = original;
  }
});
test("server: risposta Gmail senza ID non è successo", async () => {
  const { env } = fixture();
  const challenge = await token(env);
  const original = globalThis.fetch;
  globalThis.fetch = async (input) =>
    new Response(
      JSON.stringify(
        String(input).includes("oauth2") ? { access_token: "test-access" } : {},
      ),
    );
  try {
    expect(
      (
        await onRequestPost({
          env,
          request: request({ ...valid, token: challenge }),
        })
      ).status,
    ).toBe(502);
  } finally {
    globalThis.fetch = original;
  }
});

// Each failure is simulated locally. Capture only the diagnostic output to
// assert that provider payloads, exceptions and submitted values never leak.
for (const scenario of [
  { name: 'oauth_http', stage: 'oauth.response', event: 'http_error' },
  { name: 'oauth_missing', stage: 'oauth.parse', event: 'missing_access_token' },
  { name: 'oauth_json', stage: 'oauth.parse', event: 'exception' },
  { name: 'oauth_network', stage: 'oauth.fetch', event: 'exception' },
  { name: 'gmail_http', stage: 'gmail.response', event: 'http_error' },
  { name: 'gmail_missing', stage: 'gmail.parse', event: 'missing_message_id' },
  { name: 'gmail_json', stage: 'gmail.parse', event: 'exception' },
  { name: 'gmail_network', stage: 'gmail.fetch', event: 'exception' },
  { name: 'kv_read', stage: 'kv.rate.read', event: 'exception' },
  { name: 'kv_replay_read', stage: 'kv.replay.read', event: 'exception' },
  { name: 'kv_write', stage: 'kv.rate.write', event: 'exception' },
  { name: 'kv_replay_write', stage: 'kv.replay.write', event: 'exception' },
]) test(`diagnostica privata: ${scenario.name}`, async () => {
  const { env } = fixture();
  const challenge = await token(env);
  const originalFetch = globalThis.fetch, originalError = console.error, originalInfo = console.info;
  const logs: string[] = [];
  console.error = (...args) => { logs.push(args.join(' ')); };
  console.info = (...args) => { logs.push(args.join(' ')); };
  const sensitive = `${env.GOOGLE_CLIENT_SECRET} ${env.GOOGLE_REFRESH_TOKEN} ${env.CONTACT_FORM_SECRET} test-access ${valid.email} ${valid.name} ${valid.project} 192.0.2.1`;
  let reads = 0, writes = 0;
  if (scenario.name.startsWith('kv_')) {
    env.CONTACT_RATE_LIMIT.get = async () => {
      reads++;
      if ((scenario.name === 'kv_read' && reads === 1) || (scenario.name === 'kv_replay_read' && reads === 2)) throw new Error(sensitive);
      return null;
    };
    env.CONTACT_RATE_LIMIT.put = async () => {
      writes++;
      if ((scenario.name === 'kv_write' && writes === 1) || (scenario.name === 'kv_replay_write' && writes === 2)) throw new Error(sensitive);
    };
  }
  let calls = 0;
  globalThis.fetch = async input => {
    calls++;
    const oauth = String(input).includes('oauth2');
    if (scenario.name === (oauth ? 'oauth_network' : 'gmail_network')) throw new DOMException(sensitive, 'TimeoutError');
    if (scenario.name === (oauth ? 'oauth_json' : 'gmail_json')) return new Response('invalid JSON ' + sensitive);
    if (scenario.name === (oauth ? 'oauth_missing' : 'gmail_missing')) return new Response(JSON.stringify(oauth ? { access_token: {} } : { id: {} }));
    if (scenario.name === 'oauth_http' && oauth) return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.', refresh_token: sensitive }), { status: 400 });
    if (scenario.name === 'gmail_http' && !oauth) return new Response(JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', message: sensitive, errors: [{ reason: 'insufficientPermissions', message: sensitive }] } }), { status: 403 });
    return new Response(JSON.stringify(oauth ? { access_token: 'test-access' } : { id: 'test-message-id' }));
  };
  try {
    const result = await onRequestPost({ env, request: request({ ...valid, token: challenge }) });
    expect(result.status).toBe(502);
    expect(await result.json()).toEqual({ ok: false, code: 'delivery' });
    const records = logs.map(line => JSON.parse(line.slice('[contact] '.length)));
    const failure = records.find(record => record.event !== 'access_token_received');
    expect(failure.stage).toBe(scenario.stage);
    expect(failure.event).toBe(scenario.event);
    expect(failure.diagnosticId).toMatch(/^[a-f0-9-]{36}$/);
    if (scenario.name === 'oauth_http') {
      expect(failure).toMatchObject({ status: 400, error: 'invalid_grant', error_description: 'Token has been expired or revoked.' });
    }
    if (scenario.name === 'gmail_http') {
      expect(failure).toMatchObject({ status: 403, error_code: 403, error_status: 'PERMISSION_DENIED', message: 'omitted_unrecognized_provider_text', reasons: ['insufficientPermissions'] });
    }
    if (scenario.name.endsWith('_network')) expect(failure.exception).toBe('TimeoutError');
    if (scenario.name.startsWith('kv_')) expect(calls).toBe(0);
    for (const privateValue of [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REFRESH_TOKEN, env.CONTACT_FORM_SECRET, 'test-access', valid.email, valid.name, valid.project, '192.0.2.1', challenge, 'test-message-id']) {
      expect(logs.join('\n')).not.toContain(privateValue);
    }
  } finally {
    globalThis.fetch = originalFetch; console.error = originalError; console.info = originalInfo;
  }
});
