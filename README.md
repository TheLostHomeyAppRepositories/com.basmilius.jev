# Jev for Homey

Use TypeSafe Jev to make decisions in Homey Flows from context you provide. Create a choice or yes/no question in the app settings, then evaluate it with text and Flow tags.

The app does not read devices or gather household state. Only the question, allowed outcomes, optional background and context you supply go to TypeSafe.

## Getting started

1. Install dependencies and build using the commands in [AGENTS.md](AGENTS.md).
2. Install the app on a development Homey with `homey app run`.
3. Open app settings, enter a TypeSafe API key and save the connection. A connection test makes a small paid API call.
4. Create a decision. Give each choice a name and a description of when it applies. Save it, then test with your own example context.
5. Add **Evaluate a decision** to a Flow. Fill Context with text and Homey tags.

For example, create a lighting decision with Film, Reading and No change as outcomes. Supply context such as “The television is on, two people are home and it is dark outside.” Connect the accepted result to the appropriate existing Homey actions.

## Flow behavior

Regular Flows can use **A decision is accepted**, **An accepted outcome changes** and **A decision cannot be used**. Select a decision on the trigger. Compare the accepted outcome with the condition card before running an action.

Advanced Flow receives the outcome ID and label directly from the evaluation action, together with probability, confidence, evaluation ID, timestamp, duration and model. Stable IDs survive renames; use the outcome condition card's autocomplete when you do not want to compare IDs manually.

An uncertain, expired, superseded or cooldown-blocked evaluation rejects the action, as does an API error. Route the Advanced Flow error output explicitly if you need fallback behavior. It never returns a default no answer. A superseded evaluation does not trigger regular Flows.

The outcome condition throws when there is no current accepted result, so inverting that card does not turn missing data into permission to act. The freshness condition can check whether a usable result exists without an API call.

Choice confidence and Noul yes/no thresholds are configurable. A Noul answer between its no and yes thresholds is uncertain. The confidence tag is −1 for Noul because the API does not return a separate confidence value; probability is the chance of yes. For Choice, probability is the selected option's probability. A missing probability is −1.

The minimum time between outcome changes prevents repeated switching. Identical outcomes refresh validity without restarting this interval. Editing a decision or connection invalidates existing results. Decisions and results survive restarts; their validity still expires based on the original evaluation time.

## Testing and privacy

The settings test calls TypeSafe and records the result, but never updates production state or starts Flows. Save edits before testing. The latest 50 evaluations are stored without their per-call context. User-written questions, option descriptions and fixed background are stored as decision settings.

Requests time out after 10 seconds by default. The app allows 30 evaluations per minute and four in flight at once. Timeout and per-minute limit are configurable. Requests are not retried automatically.

This first version supports Choice and Noul. Score, batching, automatic caching, cost accounting and App Store promotional assets are not included. No automatic device context is planned.

TypeSafe API access and credit are required. See the [official API documentation](https://docs.typesafe.ai/api).
