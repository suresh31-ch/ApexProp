-- ApexProp AI — Advanced Root-Cause & Risk Intelligence Engine Schema
-- Migration: 20261104000000_investigation_risk_engine.sql
-- Idempotent upgrades to investigations, risk_assessments, and human_reviews

-- 1. Extend investigations table with rich hypothesis, question, and outcome tracking
ALTER TABLE public.investigations
  ADD COLUMN IF NOT EXISTS outcome_status TEXT DEFAULT 'INVESTIGATION_REQUIRED'
  CHECK (outcome_status IN (
    'INVESTIGATION_REQUIRED',
    'EVIDENCE_INSUFFICIENT',
    'MULTIPLE_PLAUSIBLE_CAUSES',
    'PROFESSIONAL_ASSESSMENT_REQUIRED',
    'CAUSE_SUPPORTED_BY_EVIDENCE',
    'COMPLETED_WITH_LIMITATIONS'
  )),
  ADD COLUMN IF NOT EXISTS hypotheses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS follow_up_questions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS human_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS human_action TEXT DEFAULT 'PENDING'
  CHECK (human_action IN (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'AMENDED',
    'REQUEST_INSPECTION',
    'MARK_INSUFFICIENT'
  )),
  ADD COLUMN IF NOT EXISTS escalation_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_instructions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Extend risk_assessments with multi-dimensional risk matrix
ALTER TABLE public.risk_assessments
  ADD COLUMN IF NOT EXISTS multi_dimensional_risk JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_category TEXT DEFAULT 'Moderate'
  CHECK (risk_category IN ('Critical', 'High', 'Moderate', 'Low', 'Insufficient Evidence')),
  ADD COLUMN IF NOT EXISTS safety_escalated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Create human_reviews audit table for property manager actions
CREATE TABLE IF NOT EXISTS public.human_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'ACCEPT',
    'REJECT',
    'AMEND',
    'REQUEST_INSPECTION',
    'MARK_INSUFFICIENT'
  )),
  reviewed_hypothesis_id TEXT,
  professional_notes TEXT NOT NULL,
  outcome_decision TEXT,
  escalation_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.human_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "human_reviews_select_own" ON public.human_reviews;
CREATE POLICY "human_reviews_select_own" ON public.human_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "human_reviews_insert_own" ON public.human_reviews;
CREATE POLICY "human_reviews_insert_own" ON public.human_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.inspections WHERE inspections.id = inspection_id AND inspections.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "human_reviews_delete_own" ON public.human_reviews;
CREATE POLICY "human_reviews_delete_own" ON public.human_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_human_reviews_inspection_id ON public.human_reviews(inspection_id);
CREATE INDEX IF NOT EXISTS idx_human_reviews_user_id ON public.human_reviews(user_id);
