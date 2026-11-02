---
"@zedtech/zedkit-ui": patch
---

A plain `.dark` section inside an identity scope follows the nearest scope even when a deeper scope of another look sits between them (Tide scope to Press scope to dark used to resolve to Tide, by file order). Two looks nested alternately (X in Y in X) need `ThemeScope mode="dark"`, which carries the look on its own node and is exact at any depth.

`parseIdentityTokens` takes only plain CSS values from pasted recipes and shared links: braces, semicolons, comments, at-rules, `url()`, unbalanced brackets or quotes are rejected, and a value is capped at 400 characters. Real font stacks, shadows and `calc()`/`var()` values still pass. Rejected values are ones that wrote past their declaration into the stylesheet.

`ScrollScenes` fades scenes with opacity only: an animated `translate` made the scene the containing block of its `position: fixed` content, so a toast inside it was laid out against the scene.

`SecretField` with `multiline` wraps, as its docs always said: it was `white-space: nowrap` inside a textarea that scrolled sideways, so a long install command did not read in full on a phone.

`TabsTrigger` draws its focus ring inside the trigger: `TabsList` scrolls sideways, which clipped a ring drawn outside its 4px padding.
