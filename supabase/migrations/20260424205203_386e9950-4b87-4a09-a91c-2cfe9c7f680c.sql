CREATE TABLE public.studio_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can submit a message
CREATE POLICY "Anyone can submit studio messages"
ON public.studio_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 100
  AND length(trim(email)) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(trim(message)) BETWEEN 1 AND 2000
);

-- No SELECT/UPDATE/DELETE policies = nobody can read or modify via the API.
-- Messages are only visible in the Cloud backend table viewer.

CREATE INDEX idx_studio_messages_created_at ON public.studio_messages (created_at DESC);