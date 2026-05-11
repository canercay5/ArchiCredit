# ArchiCredit — Dijital Kredi ve Geri Ödeme Yönetim Sistemi

Bireysel müşterilere yönelik dijital kredi yönetimi: başvuru, taksit planı, ödeme takibi.

---

## Hızlı Başlangıç

### Gereksinimler
- .NET 9 SDK
- SQL Server LocalDB (Visual Studio veya [indirme](https://learn.microsoft.com/tr-tr/sql/database-engine/configure-windows/sql-server-express-localdb))
- Node.js 18+

### Backend

```bash
cd backend
dotnet restore
dotnet run --project src/ArchiCredit.Api
```

İlk çalıştırmada veritabanı ve tablolar otomatik oluşturulur (`db.Database.Migrate()`).

API: `http://localhost:5062`  
Swagger: `http://localhost:5062/swagger`

**İlk admin kullanıcısı oluşturmak için:**
```http
POST http://localhost:5062/api/auth/register
{
  "username": "admin",
  "password": "Admin123!",
  "role": 1
}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Uygulama: `http://localhost:5173`

---

## Mimari

### Backend — Clean Architecture

```
ArchiCredit.Domain        → Entity, Enum, Exception (dış bağımlılık yok)
ArchiCredit.Application   → DTO, Service, Interface, Validator (Domain'e bağımlı)
ArchiCredit.Infrastructure → DbContext, EF Core, Mock servisler (Application'a bağımlı)
ArchiCredit.Api           → Controller, Middleware, Program.cs (Infrastructure'a bağımlı)
ArchiCredit.Tests         → xUnit birim testleri
```

### Frontend — React + Vite + TypeScript

```
src/types/         → TypeScript interface ve enum'lar
src/services/      → Axios HTTP client
src/context/       → AuthContext (JWT state yönetimi)
src/components/    → Layout, ProtectedRoute
src/pages/         → Customers, Loans, Payments sayfaları
```

---

## Temel Özellikler

| Özellik | Detay |
|---|---|
| Müşteri CRUD | Oluştur, listele, güncelle, sil |
| Kredi Tanımlama | İhtiyaç / Eğitim / Taşıt, kredi skoru kontrolü |
| Otomatik Taksit | Anüite formülü ile aylık taksit planı |
| Ödeme İşlemi | Taksit öde → durum güncelle → kredi kapat |
| Borç Özeti | Toplam borç, gecikmiş taksitler, özet ekranı |
| JWT Auth | Admin ve Müşteri rolleri |
| Mock Servisler | CreditScore + PaymentGateway |

---

## Taksit Hesaplama Formülü

```
A = P × (r × (1+r)^n) / ((1+r)^n − 1)

P: Anapara
r: Aylık faiz oranı (yıllık % / 12 / 100)
n: Vade (ay)
A: Aylık eşit taksit tutarı
```

---

## Test

```bash
cd backend
dotnet test
```

10 birim testi — taksit hesaplama (5) ve ödeme akışı (4) + gecikmiş taksit kontrolü.

---

## Dokümantasyon

| Dosya | İçerik |
|---|---|
| [docs/ER-Diagram.md](docs/ER-Diagram.md) | Varlık-İlişki diyagramı (Mermaid) |
| [docs/API-Endpoints.md](docs/API-Endpoints.md) | Tüm endpoint listesi + örnekler |
| [docs/LoanCreation-Flow.md](docs/LoanCreation-Flow.md) | Kredi oluşturma ve ödeme sequence diyagramları |

---

## 🤖 Yapay Zeka Kullanımı

Bu projede **Claude (Anthropic)** yapay zeka destekli geliştirme yaklaşımı bilinçli olarak kullanılmıştır.

### Kullanılan Alanlar

| Alan | Açıklama |
|---|---|
| **Kod üretimi** | Entity, DTO, Controller, Service iskeletleri AI ile üretildi |
| **Business logic** | Anüite formülü uygulaması, ödeme akışı ve kredi kapama mantığı AI önerisi ile şekillendi |
| **Validation kuralları** | FluentValidation kuralları (TC Kimlik 11 hane, yaş ≥18, InterestRate 0-100) AI destekli oluşturuldu |
| **Test senaryoları** | xUnit test case'leri AI ile üretildi, edge case'ler (son taksit → kredi kapama, gateway başarısız) incelenerek eklendi |
| **API tasarımı** | RESTful endpoint yapısı ve HTTP durum kodları AI önerisi ile gözden geçirildi |

### Kontrol ve Gözden Geçirme

- AI'ın ürettiği her kod bloğu okundu ve domain mantığı doğrulandı
- Taksit hesaplama formülünün doğruluğu manuel hesap ile kontrol edildi
- Güvenlik açıkları (SQL injection, açık JWT key) gözden geçirildi
- AI'ın `Customer.PrincipalAmount` gibi hatalı önerileri (Customer entity'sinde olmayan alan) yakalanıp düzeltildi
- Mock servislerin `%10 başarısız` oranı bilinçli olarak test edilebilirlik için eklendi

### Sonuç

AI, yazılım geliştirme sürecini hızlandırdı; ancak domain kararları, mimari seçimler ve kod kalitesi denetimi geliştirici tarafından yönetildi.
