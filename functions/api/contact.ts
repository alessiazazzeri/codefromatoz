import { contactLog, exceptionKind, googleError } from "../../server/contact-diagnostics";
import { contactNeeds } from "../../src/data/contact";
interface KV {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options: { expirationTtl: number },
  ): Promise<void>;
}
export interface ContactEnv {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  CONTACT_FORM_SECRET: string;
  CONTACT_RATE_LIMIT: KV;
}
interface Context {
  request: Request;
  env: ContactEnv;
}
const mailbox = "info@codefromatoz.it";
const encoder = new TextEncoder();
const ttl = 3600;
function json(
  body: object,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
function configured(env: ContactEnv) {
  return Boolean(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN &&
    env.CONTACT_FORM_SECRET?.length >= 32 &&
    env.CONTACT_RATE_LIMIT,
  );
}
async function sign(secret: string, text: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return [
    ...new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(text)),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function verify(secret: string, text: string, signature: string) {
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(signature.match(/../g)!, (v) =>
    parseInt(v, 16),
  );
  return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(text));
}
export async function onRequestGet({ request, env }: Context) {
  if (!configured(env)) return json({ ok: false, code: "unavailable" }, 503);
  const origin = new URL(request.url).origin;
  const issued = Date.now();
  const nonce = crypto.randomUUID();
  const payload = `${issued}.${nonce}`;
  return json({
    ok: true,
    token: `${payload}.${await sign(env.CONTACT_FORM_SECRET, origin + "." + payload)}`,
  });
}
export async function onRequestPost({ request, env }: Context) {
  if (!configured(env)) return json({ ok: false, code: "unavailable" }, 503);
  const origin = new URL(request.url).origin;
  if (request.headers.get("Origin") !== origin)
    return json({ ok: false, code: "forbidden" }, 403);
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim() !==
    "application/json"
  )
    return json({ ok: false, code: "format" }, 415);
  if (Number(request.headers.get("Content-Length")) > 16384)
    return json({ ok: false, code: "size" }, 413);
  let body: Record<string, unknown>;
  try {
    // Bound the stream too: Content-Length is not trusted or always present.
    const reader = request.body?.getReader();
    if (!reader) return json({ ok: false, code: "format" }, 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16384) {
        await reader.cancel();
        return json({ ok: false, code: "size" }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw Error();
    body = parsed;
  } catch {
    return json({ ok: false, code: "format" }, 400);
  }
  if (body.honeypot) return json({ ok: false, code: "rejected" }, 400);
  const token = typeof body.token === "string" ? body.token : "";
  const [issued, nonce, signature, ...extra] = token.split(".");
  if (
    extra.length ||
    !/^\d{13}$/.test(issued ?? "") ||
    !/^[a-f0-9-]{36}$/.test(nonce ?? "") ||
    !signature
  )
    return json({ ok: false, code: "token" }, 403);
  const age = Date.now() - Number(issued);
  if (
    age < 2000 ||
    age > ttl * 1000 ||
    !(await verify(
      env.CONTACT_FORM_SECRET,
      origin + "." + issued + "." + nonce,
      signature,
    ))
  )
    return json({ ok: false, code: "token" }, 403);
  const value = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string).trim() : "";
  const name = value("name"),
    email = value("email"),
    need = value("need"),
    project = value("project");
  const fields: Record<string, string> = {};
  if (!name || name.length > 120 || /[\r\n\x00]/.test(name))
    fields.name = "Inserisci il nome (massimo 120 caratteri).";
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[^\x21-\x7e]/.test(email)
  )
    fields.email = "Inserisci un indirizzo email valido.";
  if (!(contactNeeds as readonly string[]).includes(need))
    fields.need = "Seleziona una delle opzioni disponibili.";
  if (!project || project.length > 4000 || /\x00/.test(project))
    fields.project = "Scrivi un messaggio di massimo 4.000 caratteri.";
  if (body.privacy !== true)
    fields.privacy =
      "Conferma di aver letto l’informativa privacy.";
  if (Object.keys(fields).length)
    return json({ ok: false, code: "validation", fields }, 422);
  const diagnosticId = crypto.randomUUID();
  let stage = "kv.pseudonymize";
  try {
    // KV counters are a best-effort distributed throttle, not an atomic quota.
    // Raw IPs and form contents are never stored in KV or application logs.
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const key =
      "contact:rate:" +
      (await sign(
        env.CONTACT_FORM_SECRET,
        ip + ":" + Math.floor(Date.now() / 3600000),
      ));
    stage = "kv.rate.read";
    const count = Number((await env.CONTACT_RATE_LIMIT.get(key)) ?? "0");
    if (!Number.isFinite(count) || count >= 5)
      return json({ ok: false, code: "rate" }, 429, { "Retry-After": "3600" });
    stage = "kv.replay.sign";
    const used = "contact:used:" + (await sign(env.CONTACT_FORM_SECRET, token));
    stage = "kv.replay.read";
    if (await env.CONTACT_RATE_LIMIT.get(used))
      return json({ ok: false, code: "duplicate" }, 409);
    stage = "kv.rate.write";
    await env.CONTACT_RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: ttl,
    });
    stage = "kv.replay.write";
    await env.CONTACT_RATE_LIMIT.put(used, "1", { expirationTtl: ttl });
    stage = "oauth.fetch";
    const oauth = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!oauth.ok) {
      contactLog('error', { diagnosticId, stage: 'oauth.response', event: 'http_error', status: oauth.status, ...await googleError(oauth, 'oauth') });
      return json({ ok: false, code: "delivery" }, 502);
    }
    stage = "oauth.parse";
    const credentials = (await oauth.json()) as { access_token?: unknown } | null;
    if (typeof credentials?.access_token !== 'string' || !credentials.access_token.trim()) {
      contactLog('error', { diagnosticId, stage, event: 'missing_access_token', status: oauth.status });
      return json({ ok: false, code: "delivery" }, 502);
    }
    contactLog('info', { diagnosticId, stage: 'oauth.response', event: 'access_token_received', status: oauth.status });
    stage = "mime.encode";
    const message = [
      `From: ${mailbox}`,
      `To: ${mailbox}`,
      `Reply-To: ${email}`,
      "Subject: Nuova richiesta dal portfolio",
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64(`Nome: ${name}\nEmail: ${email}\nRichiesta: ${need}\n\n${project}`)
        .match(/.{1,76}/g)!
        .join("\r\n"),
    ].join("\r\n");
    const raw = base64(message)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    stage = "gmail.fetch";
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      contactLog('error', { diagnosticId, stage: 'gmail.response', event: 'http_error', status: response.status, ...await googleError(response, 'gmail') });
      return json({ ok: false, code: "delivery" }, 502);
    }
    stage = "gmail.parse";
    const sent = (await response.json()) as { id?: unknown } | null;
    if (typeof sent?.id !== 'string' || !sent.id.trim()) {
      contactLog('error', { diagnosticId, stage, event: 'missing_message_id', status: response.status });
      return json({ ok: false, code: "delivery" }, 502);
    }
    contactLog('info', { diagnosticId, stage: 'gmail.response', event: 'message_accepted', status: response.status });
    return json({ ok: true });
  } catch (error) {
    contactLog('error', { diagnosticId, stage, event: 'exception', exception: exceptionKind(error) });
    return json({ ok: false, code: "delivery" }, 502);
  }
}
function base64(text: string) {
  let binary = "";
  for (const byte of encoder.encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export const onRequestPut = () =>
  json({ ok: false, code: "method" }, 405, { Allow: "GET, POST" });
export const onRequestDelete = onRequestPut;
export const onRequestPatch = onRequestPut;
