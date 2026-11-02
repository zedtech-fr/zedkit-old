---
"@zedtech/zedkit-server": minor
---

Add `hkdfKey` (HKDF-SHA256 purpose-bound keys), `sealSecret` / `openSecret` (AES-256-GCM secret envelope), `checkoutSuffix` / `suffixedDatabaseUrl` / `databaseNameFromUrl` (per-checkout test database names) and `clientKeyFromForwardedFor` (rate-limit key from `X-Forwarded-For`). These four needs start at alpha. Existing exports are unchanged.
