import { test, expect } from '@playwright/test';
import { googleError, exceptionKind } from '../server/contact-diagnostics';

test('risposte Google arbitrarie non possono riversare dati nei log', async () => {
  const privateText = 'visitor@example.com 192.0.2.1 private-token personal-message';
  for (const provider of ['oauth', 'gmail'] as const) {
    const body = provider === 'oauth'
      ? { error: privateText, error_description: privateText }
      : { error: { code: privateText, status: privateText, message: privateText, errors: [{ reason: privateText }] } };
    const log = await googleError(new Response(JSON.stringify(body)), provider);
    expect(JSON.stringify(log)).not.toContain(privateText);
    expect(JSON.stringify(log)).not.toContain('visitor@example.com');
    const unreadable = await googleError(new Response(privateText), provider);
    expect(unreadable).toMatchObject({ error_body: 'unreadable', exception: 'SyntaxError' });
    for (const value of [null, [], 'private-token']) {
      expect(JSON.stringify(await googleError(new Response(JSON.stringify(value)), provider))).not.toContain('private-token');
    }
  }
  expect(exceptionKind(new Error(privateText))).toBe('Error');
  expect(exceptionKind({ name: privateText, message: privateText })).toBe('unrecognized_exception');
});

test('messaggi Google dinamici classificati senza dati del progetto o account', async () => {
  const result = await googleError(new Response(JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', message: 'Gmail API has not been used in project private-project before or is disabled.', errors: [{ reason: 'accessNotConfigured' }] } })), 'gmail');
  expect(result).toMatchObject({ error_code: 403, message: 'Gmail API unavailable or disabled in the Google project', reasons: ['accessNotConfigured'] });
  expect(JSON.stringify(result)).not.toContain('private-project');
});
