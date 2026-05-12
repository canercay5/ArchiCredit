export function parseApiError(err: unknown): string {
  const e = err as { response?: { status: number; data: unknown } };

  if (!e?.response) {
    return 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
  }

  const { status, data } = e.response;

  if (status === 401) return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
  if (status === 403) return 'Bu işlem için yetkiniz bulunmuyor.';
  if (status === 404) return 'Kayıt bulunamadı.';
  if (status >= 500)  return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';

  if (status === 400) {
    if (Array.isArray(data) && data.length > 0) {
      return (data as string[]).join(' ');
    }
    const title = (data as Record<string, unknown>)?.title;
    if (typeof title === 'string') return mapBusinessRule(title);
  }

  return 'Beklenmedik bir hata oluştu.';
}

function mapBusinessRule(msg: string): string {
  if (msg.includes('already taken'))
    return 'Bu kullanıcı adı zaten kullanılıyor.';
  if (msg.includes('national ID already exists'))
    return 'Bu TC kimlik numarası zaten kayıtlı.';
  if (msg.includes('Invalid username or password'))
    return 'Kullanıcı adı veya şifre hatalı.';
  if (msg.includes('Invalid username or national'))
    return 'Kullanıcı adı veya TC kimlik numarası hatalı.';
  if (msg.includes('own account'))
    return 'Yalnızca kendi hesabınız için finansman başvurusu yapabilirsiniz.';
  if (msg.includes('can be approved'))
    return 'Yalnızca beklemedeki başvurular onaylanabilir.';
  if (msg.includes('can be rejected'))
    return 'Yalnızca beklemedeki başvurular reddedilebilir.';
  if (msg.includes('Credit score') && msg.includes('below'))
    return 'Kredi skoru yetersiz (minimum 600 gereklidir). Başvuru reddedildi.';
  return 'Geçersiz istek. Lütfen bilgileri kontrol ediniz.';
}
