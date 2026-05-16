# QA Report: `home-duo-insight-7e2`

- Commit verified: `5a2ff8f6cdb78ee9724065bd8b4b65cd1caf7fdc`
- Branch verified: `bead/home-duo-insight-7e2`
- Worktree: `/private/tmp/home-duo-insight-7e2`
- Browser session: `home-duo-insight-7e2-5a2ff8f`
- App URL under test: `http://127.0.0.1:8081/about`

## Result

- PASS

## Japanese `/about` checks

- PASS: Hero heading rendered exactly as `日本の不動産選びを、もっと、誠実に。`
- PASS: How It Works title rendered exactly as `3 ステップで、客観的な比較レポートを。`
- PASS: Features title rendered exactly as `なぜ AiSumai を選ぶか。`
- PASS: CTA title rendered exactly as `迷っている 2 つの物件を、今すぐ比較してみませんか。`
- PASS: English residue was absent from the targeted Japanese eyebrow, feature, tag, and CTA strings.
- PASS: Step chips were localized visually as `ステップ 01`, `ステップ 02`, `ステップ 03`.
- PASS: Feature chips and tags were localized visually as `特長 01-03` and `先入観に左右されない`, `すばやく把握`, `AI と専門家`.
- PASS: No broader visual/layout drift was observed around hero, How It Works, FAQ, or CTA; the page remained visually consistent aside from the inserted Features heading block.

## English `/about` sanity checks

- PASS: The new Features heading rendered as `Why choose AiSumai.`
- PASS: No raw translation keys were visible in the new heading/step-chip areas.
- PASS: No blank/`undefined`/`null` labels were visible in the new heading/step-chip areas.
- PASS: Step chips and feature chips rendered visually in English full-page capture as `STEP 01-03` and `FEATURE 01-03`.

## Artifacts

- `about-ja-top.png`
- `about-ja-full.png`
- `about-ja-features.png`
- `about-ja-cta.png`
- `about-en-full.png`
