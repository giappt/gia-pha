-- Migration bổ sung các cột mới cho claim_requests phục vụ Milestone 8
ALTER TABLE public.claim_requests
  ALTER COLUMN member_id DROP NOT NULL; -- Cho phép null khi là yêu cầu propose_child hoặc find_origin

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) NOT NULL DEFAULT 'claim_existing'
    CHECK (request_type IN ('claim_existing', 'propose_child', 'find_origin')),
  ADD COLUMN IF NOT EXISTS proposed_data JSONB,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_branch_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_claims_request_type ON public.claim_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_claims_assigned_to ON public.claim_requests(assigned_to);
