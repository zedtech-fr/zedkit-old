---
"@zedtech/zedkit-ui": minor
---

`@zedtech/zedkit-ui/marketing` gains `MarketingHeader` (compact sticky bar; links and actions open from a native disclosure on phones), `MarketingFooter` (brand, description, labelled link columns, bottom line) and `LocaleSwitch` (one item per language, current one marked, links or buttons). Links are passed as elements, so router links work.

`ZedkitUiMessages` gains three required keys (`menu`, `mainNavigation`, `language`), filled in `zedkitUiMessagesEn` and `zedkitUiMessagesFr`. Migration: apps that spread a kit bundle (`{ ...zedkitUiMessagesEn, ... }`) need nothing; apps that write a full bundle by hand add the three keys.
