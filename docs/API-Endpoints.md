# API Endpoint Listesi — ArchiCredit

Base URL: `http://localhost:5062/api`

Tüm `/api/*` endpointleri `Authorization: Bearer <token>` header'ı gerektirir.
`/api/auth/*` endpointleri public'tir.

---

## Auth

| Method | Endpoint | Açıklama | Auth |
|---|---|---|---|
| POST | `/auth/register` | Kullanıcı kaydı | Public |
| POST | `/auth/login` | Giriş → JWT token | Public |

**POST /auth/login — Request:**
```json
{ "username": "admin", "password": "123456" }
```
**Response:**
```json
{
  "token": "eyJhbGci...",
  "username": "admin",
  "role": "Admin",
  "customerId": null
}
```

---

## Customers

| Method | Endpoint | Açıklama | Rol |
|---|---|---|---|
| GET | `/customers` | Tüm müşteriler | Any |
| GET | `/customers/{id}` | Müşteri detayı | Any |
| POST | `/customers` | Yeni müşteri | Admin |
| PUT | `/customers/{id}` | Müşteri güncelle | Admin |
| DELETE | `/customers/{id}` | Müşteri sil | Admin |
| GET | `/customers/{id}/summary` | Borç özeti | Any |
| GET | `/customers/{id}/loans` | Müşterinin kredileri | Any |

**POST /customers — Request:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "nationalId": "12345678901",
  "email": "ahmet@example.com",
  "phoneNumber": "05301234567",
  "dateOfBirth": "1990-01-15"
}
```

---

## Loans

| Method | Endpoint | Açıklama | Rol |
|---|---|---|---|
| GET | `/loans` | Tüm krediler | Any |
| GET | `/loans/{id}` | Kredi detayı | Any |
| POST | `/loans` | Yeni kredi başvurusu | Any |
| PUT | `/loans/{id}` | Kredi durumu güncelle | Admin |

**POST /loans — Request:**
```json
{
  "customerId": "...",
  "loanType": 1,
  "principalAmount": 50000,
  "interestRate": 18.5,
  "termMonths": 24,
  "startDate": "2026-05-12"
}
```

> **LoanType:** 1=Personal, 2=Education, 3=Vehicle

---

## Installments

| Method | Endpoint | Açıklama | Rol |
|---|---|---|---|
| GET | `/loans/{loanId}/installments` | Kredinin taksitleri | Any |
| GET | `/installments/{id}` | Taksit detayı | Any |

---

## Payments

| Method | Endpoint | Açıklama | Rol |
|---|---|---|---|
| GET | `/payments` | Tüm ödemeler | Any |
| POST | `/payments` | Taksit öde | Any |
| GET | `/installments/{installmentId}/payment` | Taksidin ödemesi | Any |

**POST /payments — Request:**
```json
{
  "installmentId": "...",
  "amount": 2458.33
}
```

---

## External (Mock Services)

| Method | Endpoint | Açıklama | Rol |
|---|---|---|---|
| GET | `/external/credit-score/{nationalId}` | Kredi skoru sorgula | Any |
| POST | `/external/process-payment` | Ödeme işlemi simülasyonu | Any |

---

## HTTP Status Codes

| Kod | Durum |
|---|---|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 204 | İçerik yok (DELETE) |
| 400 | Validation hatası |
| 401 | Yetkisiz |
| 403 | Yasak |
| 404 | Bulunamadı |
| 422 | İş kuralı ihlali |
| 500 | Sunucu hatası |
