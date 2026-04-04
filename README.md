# School Canteen NFC Wallet (Prototype)

This project includes:

- **Frontend** (Next.js App Router + TypeScript + Tailwind + charts + forms)
- **Backend** (Next.js route handlers + Prisma + SQLite + JWT cookie auth)

## Backend stack

- Next.js API route handlers in `app/api/*`
- Prisma ORM with SQLite
- `bcryptjs` for password hashing
- `jose` for JWT signing/verification
- `zod` request validation
- Cookie session (`httpOnly`) in `session`

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_this_to_a_long_secret"
```

If `NEXT_PUBLIC_API_BASE_URL` is empty, frontend calls same-origin `/api/*`.

## Database setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed credentials:

- `admin` / `admin123` (ADMIN)
- `store1` / `store123` (STORE)
- `student1` / `user123` (USER)
- `student2` / `user123` (USER)
- `student3` / `user123` (USER)

## Run app

```bash
npm run dev
```

## Security + route protection

- Middleware protects frontend routes:
  - `/admin/*` -> ADMIN
  - `/pos/*` -> STORE
  - `/app/*` -> USER
- API routes also enforce role checks server-side.

## Implemented backend endpoints

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### POS / Store

- `GET /api/pos/me`
- `POST /api/pos/charge` (atomic + idempotency key by 2-second cooldown window)
- `GET /api/pos/transactions`

### Admin

- `POST /api/admin/topup`
- `POST /api/admin/cards/assign`
- `GET /api/admin/cards`
- `GET/POST /api/admin/stores`
- `GET/PUT/DELETE /api/admin/stores/:id`
- `GET /api/admin/stats`
- `GET /api/admin/transactions`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET/PUT/DELETE /api/admin/users/:id`
- `GET /api/admin/export/csv`
- `GET /api/admin/export/xlsx`

### User

- `GET /api/user/me`
- `GET /api/user/analytics`
- `GET /api/user/transactions`

## Example curl flow

### 1) Login as store and save cookie

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"store1","password":"store123"}'
```

### 2) Read store profile

```bash
curl -b cookies.txt http://localhost:3000/api/pos/me
```

### 3) Charge by NFC UID (idempotent in 2-second window)

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/pos/charge \
  -H "Content-Type: application/json" \
  -d '{"uid":"04AABB11CC22"}'
```

### 4) Login as admin and topup

```bash
curl -i -c admin-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

curl -b admin-cookies.txt -X POST http://localhost:3000/api/admin/topup \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","amount":1000,"note":"manual topup"}'
```
