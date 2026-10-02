ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (status IN ('New','Awaiting_Review','Assigned','Accepted','En_Route','On_Scene','In_Progress','Escalated','Resolved','Closed'));
GRANT EXECUTE ON FUNCTION private.can_access_report(uuid, uuid) TO authenticated;