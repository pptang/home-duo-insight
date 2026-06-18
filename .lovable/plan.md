# SEO 修正計畫：比較頁個別化 Meta + 移除 Lovable 標記

## 目標

1. `/comparisons/:id` 每頁產生獨立 `<title>` / `<meta description>` / `og:*` / canonical
2. 移除 `index.html` 的 `twitter:site="@lovable_dev"`

## 實作步驟

### 1. 安裝並掛載 `react-helmet-async`
- `bun add react-helmet-async`
- `src/main.tsx`：用 `<HelmetProvider>` 包住 `<App />`

### 2. `ComparisonDetail.tsx` 注入動態 head
- 在已抓到 `comparison.property_a` / `property_b` 之後渲染 `<Helmet>`
- 標題格式（中英混合，跟使用者範例對齊）：
  - `{A.address區/property_name} {A.floor_plan} vs {B.address區/property_name} {B.floor_plan} — Property Comparison | AiSumai`
- 描述格式（< 160 字元，價格用 `formatPrice`）：
  - `AI analysis of {A 簡稱} ({價格}) vs {B 簡稱} ({價格}). Compare price, commute, resale outlook on AiSumai.`
- 同步加上：`og:title` / `og:description` / `og:url` / `<link rel="canonical">`，URL = `https://home-duo-insight.lovable.app/comparisons/{id}`
- 載入中 / 找不到資料時退回通用標題

### 3. `index.html` 清理
- 刪除 `<meta name="twitter:site" content="@lovable_dev" />`
- 移除目前的 `<link rel="canonical">`（之後每頁各自管自己；首頁可在 `Index.tsx` 加一個指向 `/` 的 Helmet）
- 給首頁 `Index.tsx` 加一組基本 Helmet（canonical = `/`，title/description 維持站台預設），確保 helmet 接管後首頁仍正確

### 4. 標記 SEO findings
- 跑完後用 `seo_chat--update_findings` 把對應的 duplicate-title / duplicate-description / twitter-site 項目標 fixed

## 需要先讓你知道的 Concerns

1. **社群預覽抓不到動態值**：`react-helmet-async` 是在瀏覽器執行後才改 `<head>`。Googlebot 會執行 JS 所以 SEO 標題沒問題；但 LinkedIn / Slack / Facebook / X 的預覽爬蟲**不執行 JS**，看到的還是 `index.html` 裡的站台預設 OG。要讓社群分享也顯示個別物件，需要 SSR / 預先產生 HTML，不在這次範圍。會在 `index.html` 留一組合理的站台預設當 fallback。
2. **預覽快取**：即使之後做了 SSR，X/Facebook/LinkedIn 都會快取上次抓到的預覽，要等他們重抓或在各家 debugger 強制刷新才會更新。
3. **資料相依**：title 在 fetch 完成前無法決定；初始 HTML 仍是預設標題，毫秒級內被 Helmet 覆蓋（對 Googlebot OK）。
4. **隱私/草稿頁**：如果未來會有「私人比較」，這些頁面不該被索引；現階段先全部開放，但之後可能要按 `is_public` 加 `noindex`。
5. **物件名稱可能很長 / 含日文**：title 會做長度截斷（< 60 字元），description < 160 字元，超過就用 `…`。
6. **`twitter:site` 移除後**不會自動換成你們的帳號；如果之後有官方 X 帳號可以再加回來。
7. **不動商業邏輯**：本次只改 head / 安裝套件，比較流程、edge function、DB 都不碰。
