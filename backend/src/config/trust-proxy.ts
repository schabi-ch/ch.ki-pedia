// Express "trust proxy" setting parsed from the TRUST_PROXY env variable.
// Without it, every request behind a reverse proxy (nginx, Caddy, ...) looks
// like it comes from the proxy's IP and the rate limit would hit all users at
// once. Accepted values, see https://expressjs.com/en/guide/behind-proxies.html:
// "true", "false", a hop count such as "1", or a subnet/keyword list such as
// "loopback" or "10.0.0.0/8, 127.0.0.1".
export function parseTrustProxy(
  value: string | undefined,
): boolean | number | string {
  const raw = value?.trim() ?? '';
  if (!raw || raw.toLowerCase() === 'false') {
    return false;
  }
  if (raw.toLowerCase() === 'true') {
    return true;
  }
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}
