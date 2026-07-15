# 財務管理 App

個人財務管理 Web App。資料存在使用者自己的 Google Sheet 上。

## 開發

```bash
npm install         # 安裝套件（只第一次或更新後需要）
npm run dev         # 啟動本機開發伺服器（預設 http://localhost:5173）
npm run build       # 編譯成可部署的版本
npm run preview     # 預覽編譯後的版本
npm run lint        # 檢查程式碼風格
npm run format      # 自動排版整份程式碼
```

正式環境部署到 Vercel，接了 GitHub 整合：`git push` 到 `main` 就會自動觸發部署，不需要手動跑指令。

## 技術棧

- **Vite + React 19 + TypeScript** — 主框架
- **Tailwind CSS v4** — 樣式（使用 `@theme` 直接在 CSS 裡定義設計 token）
- **React Router (HashRouter)** — 頁面切換，不需要伺服器端 rewrite 設定
- **Zustand** — 全域狀態（目前用在「設定」狀態上）
- **TanStack Query** — Google Sheets API 的快取與重試
- **React Hook Form + Zod** — 表單驗證
- **Recharts** — 月報圓餅圖
- **date-fns** — 日期處理
- **Lucide React** — Icon

## 專案結構

```
src/
├── pages/          # 各頁面（Dashboard, Accounts, Transactions, Recurring, Report, Settings）
├── components/     # 共用元件
│   ├── AppLayout.tsx   # 整體佈局（側邊欄 + 手機 tab bar）
│   ├── PageHeader.tsx  # 頁面標題列
│   └── ui/             # 純 UI 元件（按鈕、輸入框等，待開發）
├── lib/
│   ├── google/     # OAuth (GIS Token Model) 與 Google Sheets API
│   ├── storage/    # localStorage 封裝
│   └── format.ts   # 金額、百分比格式化
├── stores/         # Zustand 狀態
├── types/          # TypeScript 型別定義
└── hooks/          # 自訂 React hooks（待開發）
```

## 設計規範

設計 token 定義在 `src/index.css` 的 `@theme` 區塊：

| Token                     | 用途                       |
| ------------------------- | -------------------------- |
| `brand-50` ~ `brand-900`  | 主色（紫色）               |
| `surface-0` ~ `surface-3` | 背景由深到淺               |
| `surface-border`          | 分隔線                     |
| `ink-high/mid/low`        | 文字主/次/淡               |
| `positive/negative`       | 收入綠 / 支出紅            |

字體：`DM Sans`（內文）、`DM Mono`（金額/數字），透過 Google Fonts 載入。

金額顯示請套用 `font-mono tabular` 兩個 class，數字會等寬對齊。

## 待辦項目

請參考 `../_reference/PROJECT_BRIEF.md` 的「下一步待辦」段落。

短期：

1. 實作 Google OAuth 2.0 PKCE 流程（`src/lib/google/auth.ts`）
2. 實作 Google Sheets API 串接（`src/lib/google/sheets.ts`）
3. 初次設定頁面（讓使用者輸入 Client ID + Sheet ID）
4. 帳戶 / 記帳 / 固定金流 的 CRUD UI
5. 月報的圓餅圖
6. ~~部署~~（已完成，見下方「部署」）

## 部署

正式環境部署在 Vercel（`https://finance-manager-sooty-two.vercel.app`），透過 GitHub 整合：
push 到 `main` 就會自動 build + 上線，不需要手動操作。

之所以用 Vercel 而不是 GitHub Pages：OAuth 交換 token 需要 server-side 執行
（`api/oauth/exchange.ts`、`api/oauth/refresh.ts` 兩支 Vercel Edge Function，
`GOOGLE_CLIENT_SECRET` 存在 Vercel 環境變數），GitHub Pages 純靜態沒有後端跑不起來。

如果要換 Google Client ID 或網址，記得同步更新：

- Vercel 專案設定的環境變數 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `src/lib/google/config.ts` 的 `clientId`
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 的「已授權的重新導向 URI」
