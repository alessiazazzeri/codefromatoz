// Never log provider bodies verbatim: even error messages can echo credentials,
// addresses or submitted content. Only recognized public codes/text are emitted.
const codes = new Set([
  'invalid_request', 'invalid_client', 'invalid_grant', 'unauthorized_client',
  'unsupported_grant_type', 'invalid_scope', 'access_denied', 'temporarily_unavailable',
  'server_error', 'admin_policy_enforced', 'org_internal',
  'INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'RESOURCE_EXHAUSTED',
  'FAILED_PRECONDITION', 'NOT_FOUND', 'INTERNAL', 'UNAVAILABLE', 'DEADLINE_EXCEEDED',
  'badRequest', 'authError', 'forbidden', 'insufficientPermissions', 'accessNotConfigured',
  'serviceDisabled', 'rateLimitExceeded', 'userRateLimitExceeded', 'dailyLimitExceeded',
  'failedPrecondition', 'domainPolicy', 'backendError', 'invalidCredentials',
  'SERVICE_DISABLED', 'ACCESS_TOKEN_SCOPE_INSUFFICIENT', 'CREDENTIALS_MISSING',
  'API_KEY_INVALID', 'IAM_PERMISSION_DENIED', 'CONSUMER_INVALID',
  'RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED', 'invalid_rapt',
]);
const descriptions = new Set([
  'Bad Request', 'Unauthorized', 'Invalid Credentials', 'Token has been expired or revoked.',
  'The OAuth client was not found.', 'Unauthorized client or scope in request.',
  'Request had insufficient authentication scopes.', 'Insufficient Permission',
  'Precondition check failed.', 'Invalid grant: account not found',
  'Invalid client secret.', 'Invalid Value', 'Internal error encountered.',
]);
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function safeCode(value: unknown) {
  return typeof value === 'string' && codes.has(value) ? value : 'unrecognized_or_missing';
}
function safeDescription(value: unknown) {
  if (typeof value !== 'string') return 'missing';
  if (descriptions.has(value)) return value;
  // Known dynamic descriptions may contain project IDs, addresses or tokens.
  // Classify them without retaining any part of the original text.
  if (/accessnotconfigured|has not been used|is disabled|service_disabled/i.test(value)) return 'Gmail API unavailable or disabled in the Google project';
  if (/sender|send.as|from address/i.test(value)) return 'Sender identity or send-as authorization rejected';
  if (/quota|rate limit|too many/i.test(value)) return 'Google quota or rate limit exceeded';
  if (/scope|permission/i.test(value)) return 'Google authorization or scope rejected';
  return 'omitted_unrecognized_provider_text';
}
export function exceptionKind(error: unknown) {
  const name = error instanceof Error || (typeof DOMException !== 'undefined' && error instanceof DOMException) ? error.name : '';
  return ['AbortError', 'TimeoutError', 'TypeError', 'SyntaxError', 'RangeError', 'Error', 'OperationError', 'DataError'].includes(name)
    ? name : 'unrecognized_exception';
}
export async function googleError(response: Response, provider: 'oauth' | 'gmail') {
  try {
    const body = object(await response.json());
    if (provider === 'oauth') return { error: safeCode(body.error), error_description: safeDescription(body.error_description) };
    const error = object(body.error);
    const reasons = [
      ...(Array.isArray(error.errors) ? error.errors : []),
      ...(Array.isArray(error.details) ? error.details : []),
    ].map(item => safeCode(object(item).reason)).filter(reason => reason !== 'unrecognized_or_missing');
    return {
      error_code: typeof error.code === 'number' && Number.isInteger(error.code) && error.code >= 100 && error.code <= 599 ? error.code : undefined,
      error_status: safeCode(error.status), message: safeDescription(error.message), reasons: [...new Set(reasons)].slice(0, 8),
    };
  } catch (error) { return { error_body: 'unreadable', exception: exceptionKind(error) }; }
}
export function contactLog(level: 'info' | 'error', record: Record<string, unknown>) {
  // Callers supply only stages, random diagnostic IDs, numeric statuses and the
  // allowlisted fields above. Never pass request/env/Error objects here.
  console[level]('[contact]', JSON.stringify(record));
}
