export function publicAssetUrl(src?: string) {
  if (!src) return '';

  if (/^(?:https?:|data:|blob:)/.test(src)) {
    return src;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${src.replace(/^\/+/, '')}`;
}
