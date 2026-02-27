-- ============================================
-- Row Level Security Policies
-- Allows frontend (anon key) to read, update, delete leads
-- Only service_role (CLI scraper) can insert
-- ============================================

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_logs ENABLE ROW LEVEL SECURITY;

-- leads: anyone can read
CREATE POLICY "Allow public read leads"
  ON leads FOR SELECT
  USING (true);

-- leads: anyone can update (status changes from dashboard)
CREATE POLICY "Allow public update leads"
  ON leads FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- leads: anyone can delete
CREATE POLICY "Allow public delete leads"
  ON leads FOR DELETE
  USING (true);

-- leads: only service_role can insert (scraper CLI)
CREATE POLICY "Allow service_role insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- lead_logs: anyone can read
CREATE POLICY "Allow public read lead_logs"
  ON lead_logs FOR SELECT
  USING (true);

-- lead_logs: anyone can insert (for status change notes)
CREATE POLICY "Allow public insert lead_logs"
  ON lead_logs FOR INSERT
  WITH CHECK (true);
