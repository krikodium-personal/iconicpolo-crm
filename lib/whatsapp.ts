export function whatsapp(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}
export function whatsappGroup(url: string | undefined) {
  const value = (url || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (
      host === 'chat.whatsapp.com' &&
      parsed.pathname.replace(/\/+$/, '').length > 1
    )
      return parsed.toString();
  } catch {
    return null;
  }
  return null;
}
