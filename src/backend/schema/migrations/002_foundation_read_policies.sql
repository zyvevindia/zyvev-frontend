-- EVSavari foundation read policies (Day 2 activation)
-- Allows anon SELECT for smoke validation and ops read paths.
-- Tighten before high-volume public traffic.

DROP POLICY IF EXISTS compare_events_anon_select ON public.compare_events;
CREATE POLICY compare_events_anon_select ON public.compare_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS trust_feedback_anon_select ON public.trust_feedback;
CREATE POLICY trust_feedback_anon_select ON public.trust_feedback
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS leads_anon_select ON public.leads;
CREATE POLICY leads_anon_select ON public.leads
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS sessions_anon_select ON public.sessions;
CREATE POLICY sessions_anon_select ON public.sessions
  FOR SELECT TO anon, authenticated USING (true);
