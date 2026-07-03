
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS gps_lat double precision,
  ADD COLUMN IF NOT EXISTS gps_lng double precision;

-- Constrain priority values via trigger (avoid immutable CHECK issues)
CREATE OR REPLACE FUNCTION public.reports_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.priority NOT IN ('low','normal','high','critical') THEN
    RAISE EXCEPTION 'invalid priority: %', NEW.priority;
  END IF;
  IF NEW.status NOT IN (
    'New','Awaiting_Review','Assigned','Accepted','En_Route','On_Scene',
    'In_Progress','Escalated','Resolved','Closed'
  ) THEN
    RAISE EXCEPTION 'invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_validate_trg ON public.reports;
CREATE TRIGGER reports_validate_trg
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_validate();

CREATE INDEX IF NOT EXISTS reports_priority_idx ON public.reports(priority);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_assigned_to_idx ON public.reports(assigned_to);
