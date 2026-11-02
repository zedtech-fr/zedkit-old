---
"@zedtech/zedkit-server": minor
---

Add `checkEndpointUrl` and `isPrivateHostname`: an SSRF guard for URLs your server calls on someone else's behalf. It allows http and https only and refuses loopback, private, link-local (cloud metadata), CGNAT, reserved and special-use hosts, including decimal, octal and hex IPv4 spellings and IPv6 with an embedded IPv4. It does not resolve DNS, so DNS rebinding is not covered. New exports only; the need starts at alpha.
