# Claude instructions for Jev

Read and follow [AGENTS.md](AGENTS.md) before making changes. It defines the product behavior, Flow contracts, architecture and validation commands.

Everything is configured on Flow cards. Do not reintroduce decisions, questions, answer editors or test playgrounds in settings. Settings are only for the API connection and general request limits. Use Claude's native Homey UI components and `homey-*` styling.

The user supplies all state and questions. Never gather device/sensor context automatically. Simple cards support one question; the advanced card supports multiple typed questions in JSON. Keep results local to the invocation, with no persistent decision state.

Start at `src/flow/index.ts`, `src/brain/request.ts` and `src/brain/jev.ts`. Run `bun run typecheck`, `bun test`, `bun run build` and `homey app build`. Report live TypeSafe and Homey-device testing separately from mocked tests. Keep the GitHub repository private.
