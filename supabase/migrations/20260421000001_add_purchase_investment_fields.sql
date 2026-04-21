-- Migration: extend properties with purchase/investment fields (bd tv7.11)
--
-- Column vs. amenities jsonb split rationale:
--   COLUMNS: fields that are commonly queried, filtered, or displayed as
--            structured data (building info, pricing, location, access).
--   amenities JSONB: infrequently-filtered boolean/text flags that are
--            rarely set and whose schema may expand without further
--            migrations (delivery_box, concierge, foreigner_purchase,
--            investment_allowed, hazard_map).
--
-- All columns are nullable so existing rows are untouched.

ALTER TABLE properties
  -- Building characteristics
  ADD COLUMN IF NOT EXISTS building_structure   text,          -- 建物構造
  ADD COLUMN IF NOT EXISTS total_units          integer,       -- 総戸数
  ADD COLUMN IF NOT EXISTS management_type      text,          -- 管理形態
  ADD COLUMN IF NOT EXISTS parking              text,          -- 駐車場
  ADD COLUMN IF NOT EXISTS pet_allowed          boolean,       -- ペット可
  ADD COLUMN IF NOT EXISTS seismic_standard     text,          -- 耐震基準

  -- Financials
  ADD COLUMN IF NOT EXISTS management_fee       integer,       -- 管理費 (yen/month)
  ADD COLUMN IF NOT EXISTS repair_reserve       integer,       -- 修繕積立金 (yen/month)
  ADD COLUMN IF NOT EXISTS price_per_tsubo      integer,       -- 坪単価 (yen)
  ADD COLUMN IF NOT EXISTS estimated_rent       integer,       -- 想定賃料 (yen/month)
  ADD COLUMN IF NOT EXISTS estimated_yield      numeric(5,2),  -- 想定表面利回り (%)

  -- Unit details
  ADD COLUMN IF NOT EXISTS floor_number         integer,       -- 階数
  ADD COLUMN IF NOT EXISTS direction            text,          -- 向き

  -- Location / access
  ADD COLUMN IF NOT EXISTS train_line           text,          -- 路線
  ADD COLUMN IF NOT EXISTS school_district      text,          -- 小学校区

  -- Rarely-set flags/values bundled into jsonb
  -- Keys: delivery_box (bool), concierge (bool),
  --       foreigner_purchase (bool), investment_allowed (bool),
  --       hazard_map (text)
  ADD COLUMN IF NOT EXISTS amenities            jsonb;         -- 宅配ボックス・コンシェルジュ等

-- Column comments
COMMENT ON COLUMN properties.building_structure  IS '建物構造 e.g. RC, SRC, 木造';
COMMENT ON COLUMN properties.total_units         IS '総戸数';
COMMENT ON COLUMN properties.management_type     IS '管理形態 e.g. 全部委託, 自主管理';
COMMENT ON COLUMN properties.parking             IS '駐車場 description or availability';
COMMENT ON COLUMN properties.pet_allowed         IS 'ペット可';
COMMENT ON COLUMN properties.seismic_standard    IS '耐震基準 e.g. 新耐震基準';
COMMENT ON COLUMN properties.management_fee      IS '管理費 (yen/month)';
COMMENT ON COLUMN properties.repair_reserve      IS '修繕積立金 (yen/month)';
COMMENT ON COLUMN properties.price_per_tsubo     IS '坪単価 (yen)';
COMMENT ON COLUMN properties.estimated_rent      IS '想定賃料 (yen/month)';
COMMENT ON COLUMN properties.estimated_yield     IS '想定表面利回り (%)';
COMMENT ON COLUMN properties.floor_number        IS '階数 floor the unit is on';
COMMENT ON COLUMN properties.direction           IS '向き compass direction e.g. 南, 南西';
COMMENT ON COLUMN properties.train_line          IS '路線 nearest train line(s)';
COMMENT ON COLUMN properties.school_district     IS '小学校区 elementary school district';
COMMENT ON COLUMN properties.amenities           IS 'Rarely-set flags: delivery_box, concierge, foreigner_purchase, investment_allowed, hazard_map';
