-- ============================================================================
-- ApexProp AI — Work Order Management, Maintenance Lifecycle & Reporting Schema
-- Migration: 20261106000000_work_order_lifecycle_and_analytics.sql
-- ============================================================================

-- 1. CONTRACTORS DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  trade TEXT NOT NULL,
  service_coverage TEXT NOT NULL DEFAULT 'All Regions',
  availability TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (availability IN ('AVAILABLE', 'BUSY', 'UNAVAILABLE')),
  license_number TEXT,
  insurance_ref TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contractors_select_own" ON public.contractors;
CREATE POLICY "contractors_select_own" ON public.contractors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "contractors_insert_own" ON public.contractors;
CREATE POLICY "contractors_insert_own" ON public.contractors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contractors_update_own" ON public.contractors;
CREATE POLICY "contractors_update_own" ON public.contractors
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contractors_delete_own" ON public.contractors;
CREATE POLICY "contractors_delete_own" ON public.contractors
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON public.contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_trade ON public.contractors(trade);

-- 2. EXPAND WORK ORDERS STATUS CONSTRAINT AND ADD LIFECYCLE COLUMNS
DO $$
BEGIN
  -- Add new lifecycle and trace columns if they do not exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='repair_plan_id') THEN
    ALTER TABLE public.work_orders ADD COLUMN repair_plan_id UUID REFERENCES public.repair_plans(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='estimate_id') THEN
    ALTER TABLE public.work_orders ADD COLUMN estimate_id UUID REFERENCES public.repair_cost_estimates(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='approved_budget_inr') THEN
    ALTER TABLE public.work_orders ADD COLUMN approved_budget_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='actual_cost_inr') THEN
    ALTER TABLE public.work_orders ADD COLUMN actual_cost_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='contractor_id') THEN
    ALTER TABLE public.work_orders ADD COLUMN contractor_id UUID REFERENCES public.contractors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='contractor_company') THEN
    ALTER TABLE public.work_orders ADD COLUMN contractor_company TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='contractor_contact') THEN
    ALTER TABLE public.work_orders ADD COLUMN contractor_contact TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='progress_percent') THEN
    ALTER TABLE public.work_orders ADD COLUMN progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='paused_reason') THEN
    ALTER TABLE public.work_orders ADD COLUMN paused_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='execution_photos') THEN
    ALTER TABLE public.work_orders ADD COLUMN execution_photos JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='materials_used') THEN
    ALTER TABLE public.work_orders ADD COLUMN materials_used JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='labour_hours') THEN
    ALTER TABLE public.work_orders ADD COLUMN labour_hours JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='verification_checklist') THEN
    ALTER TABLE public.work_orders ADD COLUMN verification_checklist JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='verified_by') THEN
    ALTER TABLE public.work_orders ADD COLUMN verified_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='verified_at') THEN
    ALTER TABLE public.work_orders ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='verification_notes') THEN
    ALTER TABLE public.work_orders ADD COLUMN verification_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='closed_by') THEN
    ALTER TABLE public.work_orders ADD COLUMN closed_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='closed_at') THEN
    ALTER TABLE public.work_orders ADD COLUMN closed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='closed_notes') THEN
    ALTER TABLE public.work_orders ADD COLUMN closed_notes TEXT;
  END IF;

  -- Drop existing status check constraint and replace with 15-state lifecycle
  ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
  ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_status_check CHECK (status IN (
    'DRAFT',
    'AWAITING_APPROVAL',
    'APPROVED',
    'READY_FOR_ASSIGNMENT',
    'ASSIGNED',
    'ACKNOWLEDGED',
    'SCHEDULED',
    'IN_PROGRESS',
    'ON_HOLD',
    'PENDING_INSPECTION',
    'COMPLETED',
    'VERIFIED',
    'CLOSED',
    'REJECTED',
    'CANCELLED'
  ));
END $$;

-- 3. WORK ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.work_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT,
  evidence_url TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_history_select_own" ON public.work_order_status_history;
CREATE POLICY "status_history_select_own" ON public.work_order_status_history
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "status_history_insert_own" ON public.work_order_status_history;
CREATE POLICY "status_history_insert_own" ON public.work_order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_status_history_work_order ON public.work_order_status_history(work_order_id);

-- 4. WORK ORDER CHANGE REQUESTS (CHANGE ORDERS) TABLE
CREATE TABLE IF NOT EXISTS public.work_order_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  additional_scope TEXT NOT NULL,
  proposed_cost_inr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_order_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "change_requests_select_own" ON public.work_order_change_requests;
CREATE POLICY "change_requests_select_own" ON public.work_order_change_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "change_requests_insert_own" ON public.work_order_change_requests;
CREATE POLICY "change_requests_insert_own" ON public.work_order_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "change_requests_update_own" ON public.work_order_change_requests;
CREATE POLICY "change_requests_update_own" ON public.work_order_change_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.work_orders WHERE work_orders.id = work_order_id AND work_orders.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_change_requests_work_order ON public.work_order_change_requests(work_order_id);

-- 5. IN-APP WORK ORDER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.work_order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.work_order_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.work_order_notifications;
CREATE POLICY "notifications_select_own" ON public.work_order_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.work_order_notifications;
CREATE POLICY "notifications_update_own" ON public.work_order_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.work_order_notifications(user_id, is_read);
