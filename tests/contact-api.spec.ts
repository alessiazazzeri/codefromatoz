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
    const body = JSON.parse(calls[1].init!.body as string);
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
