-- ============================================
-- Lead Finder Tool - Database Schema
-- ============================================

-- Custom ENUM types
CREATE TYPE website_status_enum AS ENUM ('active', 'dead', 'none');
CREATE TYPE lead_status_enum AS ENUM ('new', 'contacted', 'interested', 'rejected', 'closed');

-- ============================================
-- Table: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  address TEXT,
  phone_number VARCHAR(50),
  website_url TEXT,
  website_status website_status_enum DEFAULT 'none',
  google_maps_url TEXT,
  status lead_status_enum DEFAULT 'new',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: lead_logs
-- ============================================
CREATE TABLE IF NOT EXISTS lead_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_website_status ON leads(website_status);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_lead_logs_lead_id ON lead_logs(lead_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
