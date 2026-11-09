# MyJudge

專為教學設計的線上程式評測（Online Judge）平臺。學生可登入後閱讀題目、撰寫程式並提交；系統透過 [Judge0](https://judge0.com/) 以測資自動比對輸出結果，並提供競賽排名與課程教材瀏覽。

## 功能概覽

### 學生端

- **公告**：首頁顯示最新公告
- **題目／競賽**：依資料夾（競賽）瀏覽題目，支援可見性權限控制
- **線上編輯器**：Monaco Editor，支援 Java、Python、C++、C#
- **自動評測**：提交後呼叫 Judge0，回報通過／錯誤狀態
- **草稿**：可先儲存再提交
- **排名**：依完成題數與完成時間計算
- **課程教材**：樹狀目錄瀏覽教材，PDF 可線上預覽

### 管理端（`/admin`）

- 總覽統計（用戶／題目／競賽）
- 公告管理
- 用戶管理
- 題庫與題庫資料夾
- 競賽（資料夾）與題目配置
- 教材上傳與管理

## 技術棧

| 層級 | 技術 |
| ------ | ------ |
| 前端 | Nuxt 4、Vue 3、Tailwind CSS 4、Monaco Editor、TipTap |
| 後端 | Nuxt Server（Nitro）API Routes |
| 資料庫／儲存 | Supabase（PostgreSQL） |
| 評測引擎 | Judge0 CE（RapidAPI） |
| 部署 | 可部署至 Vercel（含 Cron 清理過期 token） |

## 系統需求

- Node.js 20+（建議 LTS）
- npm 10+
- Supabase 專案
- Judge0 RapidAPI Key

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製範例檔並填入實際值：

```bash
cp .env.example .env
```

| 變數 | 說明 |
| ------ | ------ |
| `JUDGE0_API_URL` | Judge0 API 位址（預設 RapidAPI CE） |
| `JUDGE0_API_KEY` | RapidAPI Key |
| `JWT_SECRET` | JWT 簽章密鑰（至少 32 字元的隨機字串） |
| `CRON_SECRET` | 排程／手動呼叫清理過期 token 的密鑰 |
| `SUPABASE_URL` | Supabase 專案 URL |
| `SUPABASE_KEY` | 建議使用 **service_role** key（僅伺服端，勿暴露前端） |

也可改用 `SUPABASE_SERVICE_ROLE_KEY` 代替 `SUPABASE_KEY`。

### 3. 資料庫

於 Supabase SQL Editor 依序執行 `sql/` 目錄中的遷移腳本：

1. `001_materials_and_visibility.sql` — 教材表、題目可見性與 PDF 內容支援
2. `002_announcements.sql` — 公告表
3. `003_bank_folders.sql` — 題庫資料夾

（若專案另有既有的 users／problems／folders／submit_records 等表結構，請依你的部署環境一併建置。）

### 4. 啟動開發伺服器

```bash
npm run dev
```

預設開啟 [http://localhost:3000](http://localhost:3000)。

### 5. 建置與預覽

```bash
npm run build
npm run preview
```

## 專案結構（節錄）

```text
├── pages/                 # 路由頁面（首頁、登入、題目、課程、管理後台）
├── components/            # UI 元件（Navbar、編輯器、PDF 預覽等）
├── server/api/            # 後端 API（auth、judge、problem、admin…）
├── middleware/            # 路由中介層（auth、admin、guest）
├── composables/           # 共用邏輯（如 useAuth）
├── utils/                 # 語言對應、測資、可見性等工具
├── sql/                   # Supabase 遷移 SQL
├── public/                # 靜態資源與上傳檔
└── .env.example           # 環境變數範例
```

## 支援語言

| 顯示名稱 | Monaco | Judge0 ID |
|----------|--------|-----------|
| Java     | java   | 62        |
| Python   | python | 71        |
| C++      | cpp    | 54        |
| C#       | csharp | 51        |

## 安全性備註

- 密鑰與 service role key 只放在伺服端環境變數，勿提交至版控。
- `public/uploads/` 為上傳目錄，已在 `.gitignore` 忽略實際檔案。
- 依賴安全：`monaco-editor` 固定為 `0.55.1`（0.56+ 的 exports 與 `nuxt-monaco-editor` 不相容），並以 `overrides` 固定 `dompurify@3.4.17`。Nuxt／Nitro 傳遞依賴的其餘 audit 項目需等上游修復；**請勿再執行** `npm audit fix --force`（可能會錯誤降版 Nuxt）。

## 授權

請依倉庫實際授權條款使用。若尚未指定授權，請聯繫維護者。
