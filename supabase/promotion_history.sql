-- Create promotion_history table
CREATE TABLE IF NOT EXISTS promotion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('promote', 'pass_out')),
  old_textbook_id UUID REFERENCES textbooks(id),
  new_textbook_id UUID REFERENCES textbooks(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated access" ON promotion_history;
CREATE POLICY "Authenticated access" ON promotion_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
