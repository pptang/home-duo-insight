-- Add new fields for enhanced property information extraction
-- Private Area: Exclusive floor area in square meters
-- Building Age: Construction year, month, and calculated age in years

ALTER TABLE properties 
ADD COLUMN private_area_sqm NUMERIC,
ADD COLUMN construction_year INTEGER,
ADD COLUMN construction_month INTEGER,
ADD COLUMN building_age_years NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN properties.private_area_sqm IS 'Exclusive floor area in square meters (㎡)';
COMMENT ON COLUMN properties.construction_year IS 'Year the building was constructed';
COMMENT ON COLUMN properties.construction_month IS 'Month the building was constructed (1-12)';
COMMENT ON COLUMN properties.building_age_years IS 'Calculated age of building in years from current date';