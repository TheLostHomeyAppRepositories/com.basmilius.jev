# Claude instructions for Jev

Read and follow [AGENTS.md](AGENTS.md) before making changes. It contains the product rules, architecture, validation commands and API references shared by all coding agents.

The defining constraint is user-supplied context. Do not add device discovery, automatic sensor collection or a generated house state. The user decides which information Jev receives through Flow text/tags and optional fixed background.

Start with `src/brain/decisions.ts` for behavior, `.homeycompose/flow/` for Flow contracts and `settings-ui/src/useJev.ts` for settings interactions. Preserve stable decision and option IDs, test-mode isolation and the distinction between no, uncertainty and errors.

Run `bun run typecheck`, `bun test`, `bun run build` and `homey app build` after changes. Live API and Homey-device tests require a configured account/device and must be reported separately from mocked tests. Keep the GitHub repository private.
