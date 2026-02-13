-- Fix: post_reactions UPDATE policy eksikti
-- upsert yerine insert/update/delete kullaniyoruz, UPDATE policy gerekli
-- Run this in Supabase SQL Editor

CREATE POLICY "reactions_update" ON public.post_reactions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
