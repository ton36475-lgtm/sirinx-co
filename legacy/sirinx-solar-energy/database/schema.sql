-- SIRINX Solar Energy Platform Schema
-- For Supabase (PostgreSQL)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  province TEXT,
  source TEXT, -- facebook, website, referral, etc
  status TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
  assigned_agent TEXT,
  score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  province TEXT,
  plan TEXT, -- free, pro, enterprise
  mrr DECIMAL DEFAULT 0,
  installation_date DATE,
  system_size_kw DECIMAL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installations table
CREATE TABLE installations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  province TEXT NOT NULL,
  system_size_kw DECIMAL NOT NULL,
  panel_count INTEGER,
  inverter_type TEXT,
  battery_kwh DECIMAL,
  total_cost DECIMAL,
  monthly_savings DECIMAL,
  roi_years DECIMAL,
  npv DECIMAL,
  irr DECIMAL,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, monitoring
  contractor_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors table
CREATE TABLE contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  provinces TEXT[], -- array of provinces they serve
  rating DECIMAL DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Pages table (77 provinces)
CREATE TABLE seo_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  province TEXT NOT NULL UNIQUE,
  province_th TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  meta_description TEXT,
  content JSONB,
  keywords TEXT[],
  status TEXT DEFAULT 'draft', -- draft, published, archived
  views INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Tasks table
CREATE TABLE agent_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_name TEXT NOT NULL,
  agent_layer TEXT, -- perception, analysis, decision, coordination, rd
  task_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  priority INTEGER DEFAULT 5,
  revenue_impact DECIMAL DEFAULT 0,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- facebook, google, line, tiktok
  budget DECIMAL,
  spent DECIMAL DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roi DECIMAL,
  status TEXT DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Metrics table
CREATE TABLE system_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  metric_unit TEXT,
  agent_name TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_province ON leads(province);
CREATE INDEX idx_customers_plan ON customers(plan);
CREATE INDEX idx_installations_province ON installations(province);
CREATE INDEX idx_seo_pages_province ON seo_pages(province);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent_name);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Create service role policies (for backend)
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true);
CREATE POLICY "Service role full access" ON customers FOR ALL USING (true);
CREATE POLICY "Service role full access" ON installations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON contractors FOR ALL USING (true);
