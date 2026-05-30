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
npm run deploy      # 編譯後部署到 GitHub Pages（需先設好 git remote）
```

## 技術棧

- **Vite + React 19 + TypeScript** — 主框架
- **Tailwind CSS v4** — 樣式（使用 `@theme` 直接在 CSS 裡定義設計 token）
- **React Router (HashRouter)** — 頁面切換，hash 路由可以順利在 GitHub Pages 跑
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
6. 部署到 GitHub Pages 並在 Google Cloud Console 加上 redirect URI

## 部署到 GitHub Pages

1. 把專案推上 GitHub
2. 確認 `vite.config.ts` 的 `base: './'`（已設定）
3. 跑 `npm run deploy`，會自動 build 並推到 `gh-pages` 分支
4. 在 GitHub repo 設定 → Pages 啟用，來源選 `gh-pages` 分支
5. 拿到的網址要去 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 加進「已授權的重新導向 URI」
