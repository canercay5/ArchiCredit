# ArchiCredit — AI Agent Handoff Dokümanı

> Bu doküman, projeyi devralan bir AI agent'ın mevcut durumu anlayıp kaldığı yerden devam edebilmesi için hazırlanmıştır.
> GitHub: https://github.com/canercay5/ArchiCredit

---

## 1. Projeye Genel Bakış

**ArchiCredit**, katılım bankacılığı (İslami bankacılık) modeliyle çalışan bir dijital finansman ve geri ödeme yönetim sistemidir. Faiz kavramı yoktur; bunun yerine **aylık kar payı oranı** kullanılır.

### Temel İş Akışı
1. **Müşteri** sisteme kayıt olur (self-registration)
2. **Müşteri** finansman başvurusu yapar → başvuru `Pending` statüsüyle kaydedilir
3. **Admin** başvuruyu inceler → `Approve` (kredi skoru kontrolü + taksit planı üretilir) veya `Reject`
4. **Müşteri** onaylanan finansmanın taksitlerini öder
5. Tüm taksitler ödeneninde kredi `Closed` olur

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | .NET 9, C#, ASP.NET Core Web API |
| ORM | Entity Framework Core 9.0.4 |
| Veritabanı | SQL Server LocalDB (`(localdb)\mssqllocaldb`) |
| Kimlik Doğrulama | JWT Bearer (BCrypt şifre hashleme) |
| Validasyon | FluentValidation 11.x |
| Test | xUnit + Moq |
| Frontend | React 18 + Vite + TypeScript |
| HTTP Client | Axios |
| Routing | React Router v6 |

---

## 3. Proje Yapısı

```
ArchiCredit/
├── backend/
│   ├── src/
│   │   ├── ArchiCredit.Domain/          # Entity, Enum, Exception — dış bağımlılık yok
│   │   ├── ArchiCredit.Application/     # DTO, Service, Interface, Validator
│   │   ├── ArchiCredit.Infrastructure/  # DbContext, EF Migrations, Mock Servisler
│   │   └── ArchiCredit.Api/             # Controller, Middleware, Program.cs
│   └── tests/
│       └── ArchiCredit.Tests/           # xUnit birim testleri
├── frontend/
│   └── src/
│       ├── types/index.ts               # TypeScript interface + const type objects
│       ├── services/api.ts              # Axios instance (baseURL: https://localhost:7157/api)
│       ├── context/AuthContext.tsx      # JWT state (localStorage)
│       ├── components/                  # Layout, ProtectedRoute
│       └── pages/                       # LoginPage, RegisterPage, ForgotPasswordPage,
│                                        # ProfilePage, CustomersPage, CustomerDetailPage,
│                                        # LoansPage, LoanDetailPage, PaymentsPage
├── docs/                                # ER, API, Flow diyagramları
└── HANDOFF.md                           # Bu dosya
```

---

## 4. Domain Modeli

### Entities

```
Customer          Loan              Installment       Payment
─────────         ──────────        ───────────       ───────
Id (Guid)         Id (Guid)         Id (Guid)         Id (Guid)
FirstName         CustomerId →      LoanId →          InstallmentId → (1:1)
LastName          LoanType          InstallmentNumber Amount
NationalId        PrincipalAmount   Amount            PaymentDate
Email             MonthlyProfitRate PrincipalPortion  TransactionId
PhoneNumber       TermMonths        ProfitPortion     Status
DateOfBirth       StartDate         DueDate
CreatedAt         Status            Status
UpdatedAt         CreditScore       PaidAt
                  MonthlyInstallAmt
                  TotalRepayment
                  CreatedAt
                  ApprovedAt?
                  RejectedAt?
                  RejectionReason?

User
────
Id (Guid)
Username
PasswordHash
Role (Admin=0 | Customer=1)
CustomerId? → Customer (nullable)
CreatedAt
```

### Enum Değerleri (veritabanında integer olarak saklanır)

```csharp
LoanType:          Personal=1, Education=2, Vehicle=3
LoanStatus:        Active=1, Closed=2, Pending=3, Rejected=4
InstallmentStatus: Unpaid=1, Paid=2, Overdue=3
PaymentStatus:     Success=1, Failed=2
UserRole:          Admin=0, Customer=1
```

**Frontend'de TypeScript enum yerine `const` object kullanılıyor** (`erasableSyntaxOnly` kısıtlaması):
```typescript
export const LoanStatus = { Active: 1, Closed: 2, Pending: 3, Rejected: 4 } as const;
export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];
```

---

## 5. Kritik İş Mantığı

### 5.1 Taksit Hesaplama (Anüite Formülü)

**Dosya:** `backend/src/ArchiCredit.Application/Common/InstallmentCalculator.cs`

```
A = P × (r × (1+r)^n) / ((1+r)^n − 1)

P: Anapara
r: Aylık kar payı oranı (% / 100) — YILLIK DEĞİL, AYLIK
n: Vade (ay)
A: Aylık eşit taksit tutarı
```

> **Önemli:** Önceki versiyonda yıllık faiz / 12 yapılıyordu. Şu an `r` doğrudan aylık orandır.

### 5.2 Kar Payı Oran Tablosu

**Dosya:** `backend/src/ArchiCredit.Application/Services/RateTableService.cs`

Kuveyt Türk katılım bankası referanslı aylık oranlar:

| Vade (≤) | İhtiyaç | Eğitim | Taşıt |
|---|---|---|---|
| 3 ay | 2.49% | 1.99% | 2.19% |
| 6 ay | 2.59% | 2.09% | 2.29% |
| 12 ay | 2.79% | 2.19% | 2.39% |
| 24 ay | 2.99% | 2.29% | 2.49% |
| 36 ay | 3.19% | 2.49% | 2.69% |
| 60 ay | 3.39% | 2.69% | 2.89% |
| 120 ay | 3.59% | 2.89% | 3.09% |
| >120 ay | son dilim + 0.1% | | |

Müşteri başvuru sırasında oran girmez — sistem otomatik atar. Admin onaylarken override edebilir.

### 5.3 Kredi Onay Akışı

```
POST /api/loans (Customer)
  → Loan oluşturulur, Status=Pending
  → Taksit planı OLUŞTURULMAZ

POST /api/loans/{id}/approve (Admin)
  → MockCreditScoreService.GetScoreAsync(nationalId) çağrılır
  → Skor < 600 ise BusinessRuleException fırlatılır
  → dto.OverrideProfitRate varsa oran güncellenir
  → InstallmentCalculator çalıştırılır, taksitler oluşturulur
  → Status = Active

POST /api/loans/{id}/reject (Admin)
  → Status = Rejected, RejectionReason kaydedilir
```

### 5.4 Ödeme Akışı

```
POST /api/payments (Customer)
  → Taksit kontrolü: Paid mı? → 422
  → Payment kaydı var mı? → 422
  → MockPaymentGateway.ProcessAsync(amount) — %90 başarı oranı
  → Başarılıysa: InstallmentStatus = Paid, PaidAt = now
  → Tüm taksitler ödendiyse: LoanStatus = Closed
```

### 5.5 Mock Servisler

**MockCreditScoreService:** NationalId karakter toplamı ile seed'lenen deterministic skor. Aynı müşteri her zaman aynı skoru alır. Aralık: 550-900 (bazı müşteriler her zaman reddedilir).

**MockPaymentGatewayService:** %90 başarı oranı. Test amacıyla başarısız senaryoya izin verir.

---

## 6. API Endpoint'leri

### Auth (Anonim erişim)
| Method | URL | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | JWT döndürür |
| POST | `/api/auth/register` | ⚠️ Şu an `[Authorize]` YORUMDA — güvenlik riski (aşağıya bak) |
| POST | `/api/auth/register-customer` | Müşteri self-kayıt (Customer + User oluşturur, JWT döndürür) |
| POST | `/api/auth/reset-password` | TCKN doğrulamayla şifre sıfırlama |

### Customers (JWT zorunlu)
| Method | URL | Yetki |
|---|---|---|
| GET | `/api/customers` | Admin only |
| GET | `/api/customers/{id}` | Admin veya kendi kaydı |
| POST | `/api/customers` | Admin only |
| PUT | `/api/customers/{id}` | Admin only |
| PUT | `/api/customers/{id}/profile` | Admin veya kendi kaydı (TCKN değişmez) |
| DELETE | `/api/customers/{id}` | Admin only |
| GET | `/api/customers/{id}/summary` | Admin veya kendi kaydı |
| GET | `/api/customers/{id}/loans` | Admin veya kendi kaydı |

### Loans (JWT zorunlu)
| Method | URL | Yetki |
|---|---|---|
| GET | `/api/loans` | Admin: tümü, Customer: sadece kendi |
| GET | `/api/loans/{id}` | Admin: tümü, Customer: sadece kendi |
| POST | `/api/loans` | Customer only (kendi customerId ile) |
| POST | `/api/loans/{id}/approve` | Admin only |
| POST | `/api/loans/{id}/reject` | Admin only |
| PUT | `/api/loans/{id}` | Admin only |

### Installments (JWT zorunlu)
| Method | URL | Yetki |
|---|---|---|
| GET | `/api/loans/{loanId}/installments` | Admin: tümü, Customer: sadece kendi |
| GET | `/api/installments/{id}` | Herkes (JWT ile) |

### Payments (JWT zorunlu)
| Method | URL | Yetki |
|---|---|---|
| GET | `/api/payments` | Admin only |
| GET | `/api/installments/{installmentId}/payment` | Herkes (JWT ile) |
| POST | `/api/payments` | Customer kendi taksitini öder, Admin herşeyi |

### Diğer
| Method | URL | Yetki | Açıklama |
|---|---|---|---|
| GET | `/api/profit-rates?loanType={n}&termMonths={n}` | Anonim | Önerilen aylık oran |

---

## 7. JWT Token Yapısı

```json
{
  "nameid": "user-guid",
  "unique_name": "kullanici_adi",
  "role": "Admin | Customer",
  "customerId": "customer-guid-veya-bos-string",
  "exp": "...",
  "iss": "ArchiCredit",
  "aud": "ArchiCreditApp"
}
```

**ClaimsPrincipalExtensions** (`backend/src/ArchiCredit.Api/Extensions/`):
- `User.IsAdmin()` → role == "Admin"
- `User.GetCustomerId()` → "customerId" claim'inden Guid

---

## 8. Veritabanı Konfigürasyonu

- **Server:** `(localdb)\mssqllocaldb`
- **Database:** `ArchiCreditDb`
- **Auth:** Windows Authentication (Trusted Connection)
- **Migration:** Startup'ta otomatik (`db.Database.Migrate()`)
- **Migration dosyası:** `backend/src/ArchiCredit.Infrastructure/Migrations/`
- **SSMS bağlantısı:** Server name = `(localdb)\mssqllocaldb`, Auth = Windows Authentication

---

## 9. Frontend Sayfaları ve Routing

| Route | Sayfa | Erişim |
|---|---|---|
| `/login` | LoginPage (sekmeli: Müşteri / Admin) | Public |
| `/register` | RegisterPage (müşteri self-kayıt) | Public |
| `/forgot-password` | ForgotPasswordPage (TCKN + yeni şifre) | Public |
| `/` | → `/loans` redirect | - |
| `/loans` | LoansPage (Admin: tümü + onay kuyruğu, Customer: kendi) | JWT |
| `/loans/:id` | LoanDetailPage (Admin: onayla/reddet, Customer: ödeme yap) | JWT |
| `/customers` | CustomersPage | Admin only |
| `/customers/:id` | CustomerDetailPage | JWT |
| `/profile` | ProfilePage (kendi bilgilerini düzenle) | Customer |
| `/payments` | PaymentsPage | Admin only |

### Navigasyon (Layout.tsx)
- **Admin menüsü:** Müşteriler · Krediler · Ödemeler
- **Müşteri menüsü:** Finansmanlarım · Profilim

---

## 10. ⚠️ Bilinen Sorunlar ve Dikkat Edilmesi Gerekenler

### YÜKSEK ÖNCELİK

**1. `POST /api/auth/register` — Authorize yorumda**

`AuthController.cs:18` satırında `[Authorize(Roles = "Admin")]` yoruma alınmış durumda. Kullanıcı ilk admin hesabını oluşturmak için bunu geçici olarak açtı.

```csharp
[HttpPost("register")]
//[Authorize(Roles = "Admin")]   ← BU YENİDEN AKTİF EDİLMELİ
public async Task<ActionResult<AuthResultDto>> Register([FromBody] RegisterDto dto)
```

**Çözüm seçenekleri:**
- A) Yorum satırını kaldır ve ilk admin için seed data ekle (`Program.cs`'te)
- B) Yorum satırını kaldır, ilk admin'i `register-customer` benzeri özel bir endpoint ile oluştur
- Mevcut durumda herkes admin hesabı oluşturabilir — üretim ortamı için kritik güvenlik açığı.

**2. CORS konfigürasyonu**

`Program.cs`'te CORS izin verilen origin'ler:
```csharp
policy.WithOrigins("http://localhost:5173", "http://localhost:5111")
```
Frontend HTTPS ile çalışıyorsa (`https://localhost:5173`) bu güncellenmeli.

**3. Frontend API URL**

`frontend/src/services/api.ts`:
```typescript
baseURL: 'https://localhost:7157/api'
```
Backend'in fiili çalışma portuna göre bu değişebilir. Kullanıcı bu değeri manuel olarak ayarladı.

### ORTA ÖNCELİK

**4. MockCreditScoreService — bazı müşteriler her zaman reddedilir**

Skor 550-900 aralığında, minimum eşik 600. NationalId'si düşük toplama sahip müşteriler sistematik olarak reddedilecek. Test sırasında dikkat et.

**5. `GET /api/installments/{id}` — ownership kontrolü eksik**

Bu endpoint herhangi bir JWT sahibinin herhangi bir taksit detayını görmesine izin verir. Diğer endpoint'lerdeki gibi ownership kontrolü eklenmeli.

**6. `Loan.CreditScore` Pending durumda 0**

Pending kredilerde `CreditScore = 0` çünkü onay aşamasında doldurulur. Frontend bunu gösterirken dikkatli olmalı.

---

## 11. Projeyi Çalıştırma

### Backend
```bash
cd backend
dotnet run --project src/ArchiCredit.Api
# Swagger: https://localhost:7157/swagger (veya HTTP port)
# İlk çalıştırmada DB otomatik oluşturulur
```

### İlk Admin Oluşturma
Swagger veya curl ile (şu an register endpoint'i açık):
```json
POST /api/auth/register
{
  "username": "admin",
  "password": "Admin123!",
  "role": 0
}
```
> `role: 0` = Admin, `role: 1` = Customer

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## 12. Test Durumu

```bash
cd backend && dotnet test
# Passed: 10, Failed: 0
```

**Test Kapsamı:**
- `InstallmentCalculatorTests` (6 test): sıfır oran, oran artışı, taksit sayısı, toplam anapara, eşit taksit, kar payı azalışı
- `PaymentServiceTests` (4 test): başarılı ödeme, tekrar ödeme hatası, bulunamadı hatası, son taksit → kredi kapama

---

## 13. Git Geçmişi

```
646d11e feat: Islamic banking refactor — profit rate, approval workflow, auth & authorization
2c96792 feat: add React + TypeScript frontend
14a70a4 test: add unit tests for installment calculation and payment flow
fcca5fb feat: add Infrastructure and API layers
48e12c9 feat: add Application layer — DTOs, services, validators, JWT auth
559bba7 feat: add Domain layer — entities, enums, exceptions
eee1558 chore: add .gitignore, README, and documentation
```

---

## 14. Önerilen Sonraki Adımlar

Projenin mevcut durumu çalışır ve test edilebilir. Devam edilebilecek konular:

1. **Güvenlik:** `register` endpoint'ine `[Authorize(Roles = "Admin")]` geri ekle + seed data ile ilk admin oluştur
2. **Test genişletme:** Loan onay/red akışı, yetki kontrolleri (Customer başkasının kredisine erişemez) için integration testler
3. **Installment ownership kontrolü:** `GET /api/installments/{id}` endpoint'ine sahiplik doğrulaması ekle
4. **Email entegrasyonu:** Şifre sıfırlamayı TCKN yerine gerçek email flow'a taşı
5. **Pagination:** Büyük veri setlerinde `GET /api/loans`, `GET /api/customers` için sayfalama
6. **Frontend hata işleme:** Tüm sayfalarda tutarlı error boundary ve kullanıcı dostu mesajlar
7. **Admin dashboard:** Bekleyen başvuru sayısı, toplam aktif kredi tutarı gibi özet kartları

---

## 15. Önemli Dosya Referansları

| Amaç | Dosya |
|---|---|
| Anüite hesaplama | `backend/src/ArchiCredit.Application/Common/InstallmentCalculator.cs` |
| Kar payı oran tablosu | `backend/src/ArchiCredit.Application/Services/RateTableService.cs` |
| Kredi onay/red mantığı | `backend/src/ArchiCredit.Application/Services/LoanService.cs` |
| Ödeme akışı | `backend/src/ArchiCredit.Application/Services/PaymentService.cs` |
| JWT claim extraction | `backend/src/ArchiCredit.Api/Extensions/ClaimsPrincipalExtensions.cs` |
| DB konfigürasyonu | `backend/src/ArchiCredit.Infrastructure/Persistence/AppDbContext.cs` |
| Frontend tip tanımları | `frontend/src/types/index.ts` |
| Axios instance | `frontend/src/services/api.ts` |
| Auth state | `frontend/src/context/AuthContext.tsx` |
