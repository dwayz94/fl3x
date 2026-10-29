-- Members' own invite codes move from FL3X-XXXXXX to XXXX-XXXX (no brand in the code).
-- Team codes (no owner) keep their value: they may already be handed out.
-- "0 * length(code)" ties the random string to each row, so every code gets its own.
UPDATE "invite_codes" AS c
SET "code" = n."new_code"
FROM (
  SELECT "code", substr(r, 1, 4) || '-' || substr(r, 5, 4) AS "new_code"
  FROM (
    SELECT "code",
      (SELECT string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
       FROM generate_series(1, 8 + 0 * length("code"))) AS r
    FROM "invite_codes"
    WHERE "owner_id" IS NOT NULL AND "code" LIKE 'FL3X-%'
  ) x
) n
WHERE c."code" = n."code";
