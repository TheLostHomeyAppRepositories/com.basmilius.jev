# Claude instructions for Jev

Read and follow [AGENTS.md](AGENTS.md) before making changes. It defines the product behavior, Flow contracts, architecture and validation commands.

Everything is configured on Flow action cards (Then). Noul returns a boolean answer tag. Do not add condition or trigger cards. Do not reintroduce decisions, questions, answer editors or test playgrounds in settings. Settings are only for the API connection and general request limits. Use Claude's native Homey UI components and `homey-*` styling.

The user supplies all state and questions. Never gather device/sensor context automatically. Simple cards support one question. Choice also accepts a newline-separated list of 2–255 answers; the advanced card supports multiple typed questions in JSON. Keep results local to the invocation, with no persistent decision state.

Start at `src/flow/index.ts`, `src/brain/request.ts` and `src/brain/jev.ts`. Run `bun run typecheck`, `bun test`, `bun run build` and `homey app build`. Report live TypeSafe and Homey-device testing separately from mocked tests. Keep the GitHub repository private. Maintain all 13 languages listed in AGENTS.md across store READMEs, app metadata, settings and Flow cards.
