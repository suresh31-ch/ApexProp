-- ============================================================================
-- ApexProp AI — Enterprise Production Supabase PostgreSQL Migration
-- Migration: 20261103000000_apexprop_schema.sql
-- Description: Idempotent 12-table architecture with strict Row Level Security
-- Target: Supabase / PostgreSQL 15+
-- ============================================================================

-- 0. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Property Manager',
  role TEXT NOT NULL DEFAULT 'Property Manager' CHECK (role IN ('Property Manager')),
  organization TEXT NOT NULL DEFAULT 'ApexProp Assets Group',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, organization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Property Manager'),
    'Property Manager',
    COALESCE(NEW.raw_user_meta_data->>'organization', 'ApexProp Assets Group')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. PROPERTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  building_type TEXT NOT NULL CHECK (building_type IN (
    'Residential',
    'Commercial',
    'Industrial',
    'Mixed Use',
    'Hospitality',
    'Healthcare / Institutional',
    'Warehouse / Logistics'
  )),
  total_floors INT DEFAULT 1,
  year_built INT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
CREATE POLICY "properties_insert_own" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);

-- ============================================================================
-- 3. INSPECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  location TEXT NOT NULL,
  building_type TEXT NOT NULL,
  floor_or_room TEXT NOT NULL,
  user_notes TEXT,
  is_defect_identified BOOLEAN NOT NULL DEFAULT true,
  summary TEXT NOT NULL,
  defect_category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE')),
  severity_reasoning TEXT NOT NULL,
  category_a_visible_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_b_ai_hypotheses JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_c_human_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
  pipeline_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  disclaimer TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  work_order_id UUID,
  is_sample_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspections_select_own" ON public.inspections;
CREATE POLICY "inspections_select_own" ON public.inspections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "inspections_insert_own" ON public.inspections;
CREATE POLICY "inspections_insert_own" ON public.inspections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inspections_update_own" ON public.inspections;
CREATE POLICY "inspections_update_own" ON public.inspections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inspections_delete_own" ON public.inspections;
CREATE POLICY "inspections_delete_own" ON public.inspections
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_inspections_updated_at ON public.inspections;
CREATE TRIGGER set_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_severity ON public.inspections(severity);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON public.inspections(property_id);

-- ============================================================================
-- 4. INSPECTION IMAGES TABLE (Private Storage Metastore)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inspection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  pinpoint_x_percent NUMERIC(5, 2),
  pinpoint_y_percent NUMERIC(5, 2),
  pinpoint_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.inspection_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "images_select_own" ON public.inspection_images;
CREATE POLICY "images_select_own" ON public.inspection_images
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "images_insert_own" ON public.inspection_images;
CREATE POLICY "images_insert_own" ON public.inspection_images
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "images_update_own" ON public.inspection_images;
CREATE POLICY "images_update_own" ON public.inspection_images
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "images_delete_own" ON public.inspection_images;
CREATE POLICY "images_delete_own" ON public.inspection_images
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON public.inspection_images(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_images_user_id ON public.inspection_images(user_id);

-- ============================================================================
-- 5. OBSERVATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  element TEXT NOT NULL,
  visible_feature TEXT NOT NULL,
  exact_visual_evidence TEXT NOT NULL,
  visual_location_in_image TEXT,
  confidence_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "observations_select_own" ON public.observations;
CREATE POLICY "observations_select_own" ON public.observations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "observations_insert_own" ON public.observations;
CREATE POLICY "observations_insert_own" ON public.observations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "observations_update_own" ON public.observations;
CREATE POLICY "observations_update_own" ON public.observations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "observations_delete_own" ON public.observations;
CREATE POLICY "observations_delete_own" ON public.observations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_observations_inspection_id ON public.observations(inspection_id);

-- ============================================================================
-- 6. INVESTIGATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL UNIQUE REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_hypothesis TEXT NOT NULL,
  plausible_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternative_explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
  environmental_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_verified_by_human BOOLEAN NOT NULL DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investigations_select_own" ON public.investigations;
CREATE POLICY "investigations_select_own" ON public.investigations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "investigations_insert_own" ON public.investigations;
CREATE POLICY "investigations_insert_own" ON public.investigations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "investigations_update_own" ON public.investigations;
CREATE POLICY "investigations_update_own" ON public.investigations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_investigations_inspection_id ON public.investigations(inspection_id);

-- ============================================================================
-- 7. RISK ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL UNIQUE REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  urgency_level TEXT NOT NULL,
  safety_risk_evaluation TEXT NOT NULL,
  consequences_of_inaction JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_interval TEXT NOT NULL,
  requires_licensed_engineer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_select_own" ON public.risk_assessments;
CREATE POLICY "risk_select_own" ON public.risk_assessments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "risk_insert_own" ON public.risk_assessments;
CREATE POLICY "risk_insert_own" ON public.risk_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "risk_update_own" ON public.risk_assessments;
CREATE POLICY "risk_update_own" ON public.risk_assessments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_inspection_id ON public.risk_assessments(inspection_id);

-- ============================================================================
-- 8. REPAIR RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.repair_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL UNIQUE REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  temporary_mitigation_action TEXT,
  temporary_cost_range_inr TEXT,
  temporary_timeline TEXT,
  permanent_remediation_action TEXT NOT NULL,
  permanent_cost_range_inr TEXT NOT NULL,
  permanent_timeline TEXT,
  suggested_trade TEXT NOT NULL,
  cost_assumptions TEXT,
  monitoring_protocol TEXT,
  monitoring_cadence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_select_own" ON public.repair_recommendations;
CREATE POLICY "repair_select_own" ON public.repair_recommendations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_insert_own" ON public.repair_recommendations;
CREATE POLICY "repair_insert_own" ON public.repair_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "repair_update_own" ON public.repair_recommendations;
CREATE POLICY "repair_update_own" ON public.repair_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_recommendations_inspection_id ON public.repair_recommendations(inspection_id);

-- ============================================================================
-- 9. WORK ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  location TEXT NOT NULL,
  defect_category TEXT NOT NULL,
  title TEXT NOT NULL,
  trade TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
    'PENDING_APPROVAL',
    'SCHEDULED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
  )),
  assigned_to TEXT NOT NULL,
  scheduled_date DATE,
  due_date DATE,
  estimated_cost_inr TEXT,
  materials_required JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_briefing JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  is_sample_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "work_orders_select_own" ON public.work_orders;
CREATE POLICY "work_orders_select_own" ON public.work_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_orders_insert_own" ON public.work_orders;
CREATE POLICY "work_orders_insert_own" ON public.work_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_orders_update_own" ON public.work_orders;
CREATE POLICY "work_orders_update_own" ON public.work_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "work_orders_delete_own" ON public.work_orders;
CREATE POLICY "work_orders_delete_own" ON public.work_orders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER set_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_work_orders_user_id ON public.work_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_inspection_id ON public.work_orders(inspection_id);

-- Link inspection to work_order foreign key safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inspections_work_order'
  ) THEN
    ALTER TABLE public.inspections
      ADD CONSTRAINT fk_inspections_work_order
      FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 10. WORK ORDER UPDATES TABLE (Audit trail of status transitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_order_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_order_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wo_updates_select_own" ON public.work_order_updates;
CREATE POLICY "wo_updates_select_own" ON public.work_order_updates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wo_updates_insert_own" ON public.work_order_updates;
CREATE POLICY "wo_updates_insert_own" ON public.work_order_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_work_order_updates_wo_id ON public.work_order_updates(work_order_id);

-- ============================================================================
-- 11. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_ref TEXT NOT NULL UNIQUE,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  audit_score INT NOT NULL DEFAULT 90 CHECK (audit_score >= 0 AND audit_score <= 100),
  approval_status TEXT NOT NULL DEFAULT 'PENDING',
  generated_by TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reports_update_own" ON public.reports;
CREATE POLICY "reports_update_own" ON public.reports
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reports_delete_own" ON public.reports;
CREATE POLICY "reports_delete_own" ON public.reports
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reports_inspection_id ON public.reports(inspection_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);

-- ============================================================================
-- 12. AUDIT LOGS TABLE (Immutable Operational Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('INSPECTION', 'WORK_ORDER', 'APPROVAL', 'SETTINGS', 'AUTH', 'STORAGE')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Intentionally no UPDATE or DELETE policy on audit_logs to guarantee tamper-proof audit trail

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- PRIVATE STORAGE BUCKET: apexprop-inspections
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apexprop-inspections',
  'apexprop-inspections',
  false,
  26214400, -- 25MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Storage Object RLS Policies (User directory isolation: <user_id>/<filename>)
DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'apexprop-inspections' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'apexprop-inspections' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "storage_update_own" ON storage.objects;
CREATE POLICY "storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'apexprop-inspections' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'apexprop-inspections' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'apexprop-inspections' AND (storage.foldername(name))[1] = auth.uid()::text);
