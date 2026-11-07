-- ============================================================================
-- ApexProp AI — Repair Intelligence & Cost Estimation Engine Schema
-- Migration: 20261105000000_repair_cost_engine.sql
-- Idempotent tables for Repair Plans, Options, Versioned Cost Estimates,
-- Line Items, Rate Catalog, and Approval Audit Records with Row Level Security.
-- ============================================================================

-- 1. REPAIR PLANS TABLE
CREATE TABLE IF NOT EXISTS public.repair_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  defect_title TEXT NOT NULL,
  defect_category TEXT NOT NULL,
  observed_condition TEXT NOT NULL,
  possible_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnostic_tests JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_cosmetic_prohibited BOOLEAN NOT NULL DEFAULT false,
  repair_objective TEXT NOT NULL,
  recommended_approach TEXT NOT NULL,
  required_trade TEXT NOT NULL,
  required_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_workforce TEXT NOT NULL DEFAULT '2 skilled technicians',
  estimated_duration_days NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  estimated_duration_hours NUMERIC(6,2) NOT NULL DEFAULT 8.0,
  preparation_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  step_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  qc_checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  post_repair_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_precautions JSONB NOT NULL DEFAULT '[]'::jsonb,
  stop_work_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  permits_and_approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  professional_confirmation_required BOOLEAN NOT NULL DEFAULT true,
  professional_confirmation_rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_plans_select_own" ON public.repair_plans;
CREATE POLICY "repair_plans_select_own" ON public.repair_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_plans_insert_own" ON public.repair_plans;
CREATE POLICY "repair_plans_insert_own" ON public.repair_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "repair_plans_update_own" ON public.repair_plans;
CREATE POLICY "repair_plans_update_own" ON public.repair_plans
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_plans_delete_own" ON public.repair_plans;
CREATE POLICY "repair_plans_delete_own" ON public.repair_plans
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_plans_inspection_id ON public.repair_plans(inspection_id);
CREATE INDEX IF NOT EXISTS idx_repair_plans_user_id ON public.repair_plans(user_id);

-- 2. REPAIR OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.repair_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_plan_id UUID NOT NULL REFERENCES public.repair_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL CHECK (option_key IN ('OPTION_A', 'OPTION_B', 'OPTION_C')),
  title TEXT NOT NULL,
  approach_type TEXT NOT NULL CHECK (approach_type IN ('LOCALIZED', 'EXTENSIVE', 'SPECIALIST_LED')),
  scope_of_work TEXT NOT NULL,
  required_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_specialist TEXT NOT NULL,
  estimated_duration TEXT NOT NULL,
  advantages JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  preconditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_structurally_adequate BOOLEAN NOT NULL DEFAULT false,
  requires_pe_validation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_options_select_own" ON public.repair_options;
CREATE POLICY "repair_options_select_own" ON public.repair_options
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_options_insert_own" ON public.repair_options;
CREATE POLICY "repair_options_insert_own" ON public.repair_options
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_options_update_own" ON public.repair_options;
CREATE POLICY "repair_options_update_own" ON public.repair_options
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_options_plan_id ON public.repair_options(repair_plan_id);

-- 3. REPAIR COST ESTIMATES TABLE (VERSIONED)
CREATE TABLE IF NOT EXISTS public.repair_cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  repair_plan_id UUID REFERENCES public.repair_plans(id) ON DELETE CASCADE,
  repair_option_id UUID REFERENCES public.repair_options(id) ON DELETE SET NULL,
  selected_option_key TEXT DEFAULT 'OPTION_A',
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',
    'AWAITING_REVIEW',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED',
    'SUPERSEDED'
  )),
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  contingency_percent NUMERIC(5,2),
  contingency_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_percent NUMERIC(5,2),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  missing_information_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  rejection_reason TEXT,
  superseded_by UUID REFERENCES public.repair_cost_estimates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_cost_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_estimates_select_own" ON public.repair_cost_estimates;
CREATE POLICY "repair_estimates_select_own" ON public.repair_cost_estimates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_estimates_insert_own" ON public.repair_cost_estimates;
CREATE POLICY "repair_estimates_insert_own" ON public.repair_cost_estimates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "repair_estimates_update_own" ON public.repair_cost_estimates;
CREATE POLICY "repair_estimates_update_own" ON public.repair_cost_estimates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_estimates_inspection_id ON public.repair_cost_estimates(inspection_id);
CREATE INDEX IF NOT EXISTS idx_repair_estimates_user_id ON public.repair_cost_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_repair_estimates_status ON public.repair_cost_estimates(status);

-- 4. REPAIR ESTIMATE LINE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.repair_estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.repair_cost_estimates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'MATERIAL',
    'LABOUR',
    'EQUIPMENT',
    'ACCESS_SCAFFOLDING',
    'TRANSPORT_DISPOSAL',
    'OTHER'
  )),
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'No.',
  unit_rate NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  rate_source TEXT NOT NULL DEFAULT 'User Entered',
  rate_reference TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_estimate_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_line_items_select_own" ON public.repair_estimate_line_items;
CREATE POLICY "repair_line_items_select_own" ON public.repair_estimate_line_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_line_items_insert_own" ON public.repair_estimate_line_items;
CREATE POLICY "repair_line_items_insert_own" ON public.repair_estimate_line_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_line_items_update_own" ON public.repair_estimate_line_items;
CREATE POLICY "repair_line_items_update_own" ON public.repair_estimate_line_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_line_items_delete_own" ON public.repair_estimate_line_items;
CREATE POLICY "repair_line_items_delete_own" ON public.repair_estimate_line_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_line_items_estimate_id ON public.repair_estimate_line_items(estimate_id);

-- 5. REPAIR RATE CATALOG (READABLE BY AUTHENTICATED USERS)
CREATE TABLE IF NOT EXISTS public.repair_rate_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'MATERIAL',
    'LABOUR',
    'EQUIPMENT',
    'ACCESS_SCAFFOLDING',
    'TRANSPORT_DISPOSAL',
    'OTHER'
  )),
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_rate_inr NUMERIC(12,2) NOT NULL,
  description TEXT,
  region TEXT DEFAULT 'India-National',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_rate_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_catalog_select" ON public.repair_rate_catalog;
CREATE POLICY "rate_catalog_select" ON public.repair_rate_catalog
  FOR SELECT TO authenticated
  USING (true);

-- 6. REPAIR APPROVALS & AUDIT LOG
CREATE TABLE IF NOT EXISTS public.repair_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.repair_cost_estimates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'DRAFT_CREATED',
    'SUBMITTED_FOR_REVIEW',
    'APPROVED',
    'REJECTED',
    'REVISION_REQUESTED',
    'SUPERSEDED'
  )),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.repair_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "repair_approvals_select_own" ON public.repair_approvals;
CREATE POLICY "repair_approvals_select_own" ON public.repair_approvals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "repair_approvals_insert_own" ON public.repair_approvals;
CREATE POLICY "repair_approvals_insert_own" ON public.repair_approvals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_repair_approvals_estimate_id ON public.repair_approvals(estimate_id);
