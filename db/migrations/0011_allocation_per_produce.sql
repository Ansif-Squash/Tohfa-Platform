-- =============================================================================
-- 0011_allocation_per_produce.sql
-- S-27: Per-produce allocation overrides (BR-12)
-- Adds nullable crop_id to allocation_config, updates uniqueness indexes,
-- and widens the sum guard trigger to check SUM(percentage) = 100 per crop_id.
-- =============================================================================

-- +migrate Up

ALTER TABLE allocation_config
    ADD COLUMN crop_id uuid REFERENCES crop_master (id) ON DELETE CASCADE;

ALTER TABLE allocation_config
    DROP CONSTRAINT IF EXISTS allocation_config_unique;

CREATE UNIQUE INDEX idx_allocation_config_default_unique
    ON allocation_config (channel, effective_from)
    WHERE crop_id IS NULL;

CREATE UNIQUE INDEX idx_allocation_config_crop_unique
    ON allocation_config (channel, crop_id, effective_from)
    WHERE crop_id IS NOT NULL;

CREATE OR REPLACE FUNCTION app_allocation_config_sum_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_window  date;
    v_crop_id uuid;
    v_sum     numeric(6,2);
    v_count   integer;
BEGIN
    v_window  := COALESCE(NEW.effective_from, OLD.effective_from);
    v_crop_id := COALESCE(NEW.crop_id, OLD.crop_id);

    IF v_crop_id IS NULL THEN
        SELECT COALESCE(SUM(percentage), 0), COUNT(*)
          INTO v_sum, v_count
          FROM allocation_config
         WHERE effective_from = v_window
           AND crop_id IS NULL;
    ELSE
        SELECT COALESCE(SUM(percentage), 0), COUNT(*)
          INTO v_sum, v_count
          FROM allocation_config
         WHERE effective_from = v_window
           AND crop_id = v_crop_id;
    END IF;

    IF v_count > 0 AND v_sum <> 100 THEN
        RAISE EXCEPTION
            'BR-12b: allocation percentages for window % sum to %, must be 100', v_window, v_sum
            USING ERRCODE = '23514', HINT = 'code: ALLOCATION_SUM_INVALID';
    END IF;

    RETURN NULL;
END
$fn$;

-- +migrate Down

DROP INDEX IF EXISTS idx_allocation_config_crop_unique;
DROP INDEX IF EXISTS idx_allocation_config_default_unique;

DELETE FROM allocation_config WHERE crop_id IS NOT NULL;

ALTER TABLE allocation_config
    DROP COLUMN IF EXISTS crop_id;

ALTER TABLE allocation_config
    ADD CONSTRAINT allocation_config_unique UNIQUE (channel, effective_from);

CREATE OR REPLACE FUNCTION app_allocation_config_sum_guard() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
    v_window date;
    v_sum    numeric(6,2);
    v_count  integer;
BEGIN
    v_window := COALESCE(NEW.effective_from, OLD.effective_from);

    SELECT COALESCE(SUM(percentage), 0), COUNT(*)
      INTO v_sum, v_count
      FROM allocation_config
     WHERE effective_from = v_window;

    IF v_count > 0 AND v_sum <> 100 THEN
        RAISE EXCEPTION
            'BR-12b: allocation percentages for % sum to %, must be 100', v_window, v_sum
            USING ERRCODE = '23514', HINT = 'code: ALLOCATION_SUM_INVALID';
    END IF;

    RETURN NULL;
END
$fn$;
