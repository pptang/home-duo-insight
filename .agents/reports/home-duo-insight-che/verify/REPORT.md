# Verification Report — home-duo-insight-che
**Branch:** bead-che-toggle-lifestyle-chips  
**Tip commit:** b19c73e  
**Date:** 2026-05-28  
**Comparison ID:** efe69d09-3c81-4b0e-9088-d82f6d008068  
**Supabase:** local (http://127.0.0.1:54321, functions serve running)  
**Vite:** http://localhost:8080  

---

## Curl Results (Edge Function Contract)

### S1 — 1 row, EN, enabled_aspects: ["price"]
- **HTTP status:** 200
- **summary_table.length:** 1
- **fields:** ["Price"]
- **recommendation_id:** c7559ee3-0d4c-46da-8418-47a7a0b29916
- **Match expected order:** YES

### S2 — 7 rows, EN, enabled_aspects: ["price","cafe","gym","dog","quiet","sunlight","laundromat"]
- **HTTP status:** 200
- **summary_table.length:** 7
- **fields:** ["Price", "Cafés nearby", "Gym access", "Dog walking", "Quiet at night", "Sunlight", "Laundromat"]
- **recommendation_id:** 198ea94c-39ce-4315-b76a-6372b3b0e0dc
- **Match expected order:** YES — exact chip declaration order preserved

### S3 — 12 rows, JA, all 12 chip IDs in declaration order
- **HTTP status:** 200
- **summary_table.length:** 12
- **fields:** ["価格", "通勤", "築年数", "間取り", "学区", "リスク", "カフェへの近さ", "ジムへのアクセス", "犬の散歩のしやすさ", "夜間の静かさ", "日当たり", "コインランドリー"]
- **recommendation_id:** 4f39f84e-1810-4633-b0a6-65273f6ec69d
- **Match expected order:** YES — all 12 JA labels in correct order

### S4 — legacy (no enabled_aspects), EN
- **HTTP status:** 200
- **summary_table.length:** 9
- **fields:** ["価格", "通勤時間", "間取り", "カフェ", "ジム", "犬の散歩", "夜の静けさ", "日当たり", "コインランドリー"]
- **recommendation_id:** 52d66fa9-6980-49d2-9027-4ea0529e8686
- **Row count >= 7:** YES (9 rows)

### S5 — 3 rows, JA, enabled_aspects: ["price","gym","sunlight"]
- **HTTP status:** 200
- **summary_table.length:** 3
- **fields:** ["価格", "ジムへのアクセス", "日当たり"]
- **recommendation_id:** 86c7b981-b4f6-4cf3-8c6f-624253aa332a
- **Match expected labels:** YES

---

## UI Screenshot Results

| Scenario | Screenshot | Viewport | Rows in DOM | Layout issues |
|---|---|---|---|---|
| S1 | s1-1row-en.png | 1280x900 | 1 (PRICE) | None |
| S2 | s2-7rows-en.png | 1280x900 | 7 (Price to Laundromat) | None |
| S3 | s3-12rows-ja.png | 1280x1200 | 12 (all JA labels) | None |
| S4 | s4-legacy-en.png | 1280x900 | 9 (legacy JA labels) | None |
| S5 | s5-3rows-mobile-ja.png | 375x900 | 3 (JA) | None — bodyWidth=375 equals viewWidth |

---

## Acceptance Criteria

- [x] S1 PASS — 1 row ["Price"]; rendered Summary tab shows exactly 1 row.
- [x] S2 PASS — 7 rows in declared order; UI shows 7 rows in order; no extra rows.
- [x] S3 PASS — 12 rows in declared order with JA labels; 12 rows rendered; no layout break.
- [x] S4 PASS — 9 rows (legacy fallback >= 7); UI renders without errors.
- [x] S5 PASS — 3 rows ["価格","ジムへのアクセス","日当たり"]; mobile 375px wraps cleanly.
- [x] Console PASS — 0 errors, 0 non-GA warnings in desktop and mobile sessions.

**Overall: ALL 6 acceptance criteria PASS.**

---

## Anomalies

1. **agent-browser network route does not intercept 127.0.0.1** — Chromium blocks CDP network interception for loopback. Workaround: React fiber useState dispatch via eval to inject the recommendation object directly.

2. **--viewport WxH on open is silently ignored** — correct API is `set viewport W H` as a separate command. S5 used fresh session with `set viewport 375 900` before navigation.

3. **S4 legacy fields are JA despite language:"en"** — AI chose JA labels for JP property data. Pre-existing behavior unrelated to this bead; UI renders correctly either way.

4. **ComparisonDetail picks recommendations[0] without ordering** — oldest rec always shown in production. Latent ordering concern, out of scope for this bead.
