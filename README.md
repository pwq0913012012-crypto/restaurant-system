# 美味餐廳點餐系統

大型餐廳點餐管理系統，支援顧客掃碼點餐、外場服務管理、廚房訂單看板、管理後台。

## 技術棧

- **前端**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **後端**: Next.js API Routes (Route Handlers)
- **資料庫**: PostgreSQL + Prisma ORM
- **即時通訊**: Server-Sent Events (SSE)
- **驗證**: JWT (JSON Web Token)
- **UI**: Framer Motion + Lucide Icons + Recharts

## 系統角色

| 角色 | 路由 | 說明 |
|------|------|------|
| 顧客 | `/order/[桌號]` | 掃 QR Code 點餐，不需登入 |
| 服務生 | `/waiter` | 桌位管理、協助點餐、結帳 |
| 廚房 | `/kitchen` | KDS 訂單看板、製作進度管理 |
| 管理者 | `/admin` | 菜單/桌位/帳號/報表管理 |

## 快速開始

### 方式一：Docker（推薦）

```bash
docker-compose up -d
npx prisma db push
npm run db:seed
```

### 方式二：本機開發

#### 1. 安裝依賴
```bash
npm install
```

#### 2. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env，設定你的 PostgreSQL 連線字串
```

#### 3. 設定資料庫
```bash
# 產生 Prisma Client
npm run db:generate

# 建立資料表
npm run db:push

# 填入種子資料
npm run db:seed
```

#### 4. 啟動開發伺服器
```bash
npm run dev
```

開啟 http://localhost:3000

## 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理者 | admin@restaurant.com | admin123 |
| 服務生 | waiter1@restaurant.com | waiter123 |
| 廚房 | kitchen1@restaurant.com | kitchen123 |

## 主要功能

### 顧客端
- 掃 QR Code 進入點餐頁面
- 分類瀏覽 + 搜尋菜品
- 購物車管理（數量調整、備註、訂單備註）
- 即時訂單追蹤
- 加點功能（同桌多次下單）
- 呼叫服務生

### 服務生端
- 桌位總覽（依區域分組）
- 即時接收呼叫通知
- 桌位詳情（訂單明細、消費金額）
- 結帳（現金/信用卡/行動支付）
- 桌位狀態管理

### 廚房 KDS
- Kanban 式看板（待處理/製作中/待出餐）
- 逐項更新製作進度
- 一鍵整單完成
- 超時警示（15分鐘變紅）
- 新訂單音效通知
- 全螢幕模式

### 管理後台
- 菜單 CRUD（分類 + 菜品）
- 桌位管理 + QR Code 產生
- 帳號管理（服務生/廚房/管理者）
- 營收報表（折線圖/長條圖/圓餅圖）
- CSV 匯出

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/login` | 登入 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 取得當前使用者 |
| GET/POST | `/api/categories` | 分類列表/新增 |
| GET/PUT/DELETE | `/api/categories/[id]` | 分類 CRUD |
| GET/POST | `/api/menu-items` | 菜品列表/新增 |
| GET/PUT/DELETE | `/api/menu-items/[id]` | 菜品 CRUD |
| GET/POST | `/api/tables` | 桌位列表/新增 |
| GET/PUT/DELETE | `/api/tables/[id]` | 桌位 CRUD |
| GET/POST | `/api/orders` | 訂單列表/下單 |
| GET/PUT | `/api/orders/[id]` | 訂單詳情/狀態更新 |
| PUT | `/api/orders/[id]/items/[itemId]` | 訂單品項狀態更新 |
| POST | `/api/payments` | 結帳 |
| GET/POST/PUT | `/api/service-call` | 呼叫服務生 |
| GET | `/api/reports` | 營收報表 |
| GET | `/api/qrcode/[tableNumber]` | QR Code 產生 |
| GET | `/api/sse/[channel]` | SSE 即時連線 |

## 專案結構

```
restaurant-ordering-system/
├── prisma/
│   ├── schema.prisma          # 資料庫 schema
│   └── seed.ts                # 種子資料
├── src/
│   ├── app/
│   │   ├── order/[tableNumber]/  # 顧客點餐
│   │   ├── waiter/               # 外場介面
│   │   ├── kitchen/              # 廚房 KDS
│   │   ├── admin/                # 管理後台
│   │   ├── api/                  # API Routes
│   │   └── login/                # 登入頁
│   ├── hooks/                    # useCart, useSSE
│   ├── lib/                      # prisma, auth, utils, validations, sse
│   └── types/                    # TypeScript 型別
├── public/
│   └── manifest.json             # PWA manifest
├── docker-compose.yml
├── Dockerfile
└── .env.example
```
