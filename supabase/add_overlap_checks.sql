-- =============================================================================
-- Universal Overlap Prevention (Batches + Personal Slots)
-- =============================================================================

CREATE OR REPLACE FUNCTION check_universal_time_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Check against active batches
  IF EXISTS (
    SELECT 1
      FROM batch_schedules bs
      JOIN batches b ON b.id = bs.batch_id
     WHERE bs.weekday = NEW.weekday
       AND bs.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
       AND b.is_active = true
       AND bs.start_time < NEW.end_time
       AND bs.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Time overlaps with an existing batch schedule';
  END IF;

  -- 2. Check against personal slots
  IF EXISTS (
    SELECT 1
      FROM personal_slot_schedules ps
     WHERE ps.weekday = NEW.weekday
       AND ps.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
       AND ps.start_time < NEW.end_time
       AND ps.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Time overlaps with an existing personal slot';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace existing batch_schedules trigger
DROP TRIGGER IF EXISTS trg_batch_time_overlap ON batch_schedules;
CREATE TRIGGER trg_batch_time_overlap
  BEFORE INSERT OR UPDATE ON batch_schedules
  FOR EACH ROW
  EXECUTE FUNCTION check_universal_time_overlap();

-- Add trigger to personal_slot_schedules
DROP TRIGGER IF EXISTS trg_personal_slot_overlap ON personal_slot_schedules;
CREATE TRIGGER trg_personal_slot_overlap
  BEFORE INSERT OR UPDATE ON personal_slot_schedules
  FOR EACH ROW
  EXECUTE FUNCTION check_universal_time_overlap();
