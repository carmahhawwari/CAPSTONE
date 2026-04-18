---
description: Handoff prompt for moving current CAPSTONE work back to Conductor, including the current git tree and next actions.
---

You are taking over the CAPSTONE repo from a previous agent.

Current focus:
- The compose screen now uses a block-based receipt canvas.
- The block editor is visible on the compose screen and supports up to 8 blocks.
- Supported block types: text, word art, and image.
- Sent notes now carry receipt block data as a fallback-friendly payload.
- The prompt flow now opens `/compose`.

What to verify next:
- Open the compose screen and confirm the add-block controls are immediately visible.
- Confirm the live preview updates when adding, reordering, editing, and removing blocks.
- Confirm the note can still be submitted and that the history/envelope views still render the flattened content correctly.
- If desired, wire the incoming note views to render richer block content instead of only flattened text.

Current git tree summary:
- Root workspace diff shows a dirty submodule pointer at `CAPSTONE`.
- Root workspace changes include `scripts/print-server.mjs`, `src/components/Receipt.tsx`, `src/lib/escpos.ts`, `src/pages/HomeScreen.tsx`, `src/pages/TestPrintScreen.tsx`, `src/types/app.ts`, `last-print.bin`, and `preview.png`.
- Inside the `CAPSTONE` submodule, the main changed files are `src/components/ReceiptCanvas.tsx`, `src/contexts/orbit.tsx`, `src/lib/receipt-blocks.ts`, `src/pages/Prompts.tsx`, `src/pages/Write.tsx`, `src/types/index.ts`, and `src/index.css`.
- `npm run build` passed in the CAPSTONE submodule after the compose-screen changes.

If you continue the compose work, prioritize the CAPSTONE submodule first. The root print-server/test-print changes look separate and should only be touched if you are intentionally working on printer preview behavior.
