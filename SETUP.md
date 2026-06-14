# راهنمای راه‌اندازی داشبورد استخدام

## روش ۱: Docker (توصیه شده - سریع‌ترین)

```bash
# ۱. کپی فایل تنظیمات
cp .env.example .env

# ۲. ویرایش .env (در صورت نیاز رمزها را عوض کنید)
nano .env

# ۳. ساخت و اجرا
docker compose up -d

# ۴. مشاهده لاگ‌ها
docker compose logs -f server
```

سایت روی http://localhost در دسترس است.

---

## روش ۲: نصب مستقیم روی لینوکس

### پیش‌نیازها
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql

# Redis
sudo apt install -y redis-server
sudo systemctl start redis
```

### راه‌اندازی دیتابیس
```bash
sudo -u postgres psql << EOF
CREATE USER recruitment_user WITH PASSWORD 'recruitment_pass_2024';
CREATE DATABASE recruitment_db OWNER recruitment_user;
GRANT ALL PRIVILEGES ON DATABASE recruitment_db TO recruitment_user;
EOF
```

### نصب و اجرا
```bash
# نصب وابستگی‌ها
npm run install:all

# تنظیم محیط
cp .env.example server/env.local
nano server/env.local  # مقادیر دیتابیس را وارد کنید

# مایگریشن و seed
cd server && npx prisma migrate deploy && npx ts-node src/seed.ts
cd ..

# اجرای همزمان سرور و کلاینت (development)
npm run dev
```

### دسترسی
- **Frontend**: http://localhost:5002
- **Backend API**: http://localhost:3002/api
- **Prisma Studio**: `npm run db:studio`

---

## اطلاعات ورود پیش‌فرض

| نقش | نام کاربری | رمز عبور |
|-----|-----------|----------|
| ادمین | `admin` | `adminpassword` |
| کارشناس HR | `hr` | `hrpassword` |

> **مهم**: حتماً رمزها را در محیط production تغییر دهید.

---

## معماری

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client (React) │────▶│  Server (Express)│────▶│  PostgreSQL  │
│   Port: 80/5002  │◀────│  Port: 3002      │     │  Port: 5432  │
│   Vite + Tailwind│     │  Prisma ORM      │────▶│    Redis     │
│   Recharts       │  WS │  JWT Auth        │     │  Port: 6379  │
│   Framer Motion  │◀───▶│  WebSocket       │     └──────────────┘
└─────────────────┘     └─────────────────┘
```

## ساختار پروژه

```
recruitment-dashboard/
├── server/          # Backend Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # منطق کنترلرها
│   │   ├── middleware/      # Auth, RateLimit
│   │   ├── routes/          # API routes
│   │   ├── services/        # WebSocket, Cache, Email
│   │   └── seed.ts          # داده‌های اولیه
│   └── prisma/schema.prisma # مدل دیتابیس
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/      # کامپوننت‌های UI
│   │   ├── contexts/        # State management
│   │   └── services/        # API communication
│   └── nginx.conf           # تنظیمات nginx
└── docker-compose.yml       # اجرای کامل stack
```
