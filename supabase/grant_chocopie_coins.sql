-- One-time developer wallet grant
UPDATE public.wallets AS w
SET coins = 1000000000
FROM public.profiles AS p
WHERE p.id = w.user_id
  AND p.username = 'chocopie=3.14';
