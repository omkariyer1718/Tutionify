-- =============================================================================
-- Cascade Textbook Updates to Batches
-- =============================================================================

-- When a textbook's name or grade is updated, its display_name changes.
-- Since batches use the textbook's display_name in their own display_name,
-- we must push an update to those batches to trigger their own renaming logic.

CREATE OR REPLACE FUNCTION cascade_textbook_update_to_batches()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
    -- A dummy update of textbook_id to itself on the batches table
    -- This fires the trg_batch_display_name trigger to refresh the batch name
    UPDATE batches
       SET textbook_id = NEW.id
     WHERE textbook_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_textbook_update ON textbooks;
CREATE TRIGGER trg_cascade_textbook_update
  AFTER UPDATE ON textbooks
  FOR EACH ROW
  EXECUTE FUNCTION cascade_textbook_update_to_batches();
