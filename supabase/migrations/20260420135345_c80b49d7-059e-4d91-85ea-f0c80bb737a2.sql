-- Create site_settings singleton table
CREATE TABLE public.site_settings (
  id BOOLEAN NOT NULL PRIMARY KEY DEFAULT true,
  title TEXT NOT NULL DEFAULT 'DDS Chorlitos',
  description TEXT NOT NULL DEFAULT 'Marca los fines de semana (viernes a domingo) que no puedes asistir. El número indica cuántos no pueden ese día.',
  emoji TEXT NOT NULL DEFAULT '📅',
  start_year INTEGER NOT NULL DEFAULT 2026,
  start_month INTEGER NOT NULL DEFAULT 6,
  end_year INTEGER NOT NULL DEFAULT 2026,
  end_month INTEGER NOT NULL DEFAULT 11,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT singleton_check CHECK (id = true)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update site settings"
  ON public.site_settings FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (true);

-- Insert default row
INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;