-- Secure coin spending for equipment upgrades.
-- Run this file once in the Supabase SQL Editor.

DROP FUNCTION IF EXISTS public.equipment_spend_coins(bigint);

CREATE FUNCTION public.equipment_spend_coins(p_amount bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_coins bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  SELECT coins
  INTO v_coins
  FROM public.wallets
  WHERE user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;

  IF v_coins < p_amount THEN
    RAISE EXCEPTION 'insufficient coins';
  END IF;

  UPDATE public.wallets
  SET coins = coins - p_amount
  WHERE user_id = v_uid;

  RETURN v_coins - p_amount;
END;
$$;

ALTER FUNCTION public.equipment_spend_coins(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.equipment_spend_coins(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.equipment_spend_coins(bigint) TO authenticated;
