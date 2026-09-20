# Jev for Homey

Ask TypeSafe Jev questions directly in your Homey Flows. Supply the state, question and possible answers on a card. The app does not discover devices or collect household state.

Settings contain your TypeSafe API key, model, timeout, request limit and a connection test. There is no decision editor or saved decision registry.

## Flow cards

| Card | Input | Output |
| --- | --- | --- |
| Ask a question with 2 answers | State, one question, two answers, minimum confidence | Answer text, answer number, confidence, probability |
| Ask a question with 3 answers | State, one question, three answers, minimum confidence | Answer text, answer number, confidence, probability |
| Ask a question with 4 answers | State, one question, four answers, minimum confidence | Answer text, answer number, confidence, probability |
| Ask a yes/no question | State, one question, minimum probability | Boolean answer and probability of yes |
| Score a question with 3 levels | State, one question, descriptions of low/middle/high, minimum confidence | Score from 0 to 2, including fractions, and confidence |
| Evaluate state and questions from JSON | JSON containing state and questions | All answers as JSON |

All cards appear under Then and also return the resolved model, input/output token counts, evaluation ID and duration. Action result tags can be connected in Advanced Flow. Use the yes/no card’s boolean Answer tag in a Logic condition to branch on its result. Each card makes a fresh API call.

Each simple card evaluates exactly one question. Text fields accept Flow tags. Describe what every value means in state, and include units for measurements. For example, write `Bas is sleeping: [Asleep]. Living room temperature: [Temperature] °C.` and insert the corresponding Flow tags at the bracketed positions. This gives Jev the meaning of the values even when a tag resolves to `true`, `false` or a number. Choice answer numbers start at 1 and match the order of the answer fields, so you can branch on the answer number without matching text.

For example, use the three-answer card with:

- State: `We are watching a film, guests are here and it is dark outside.`
- Question: `Which light scene fits?`
- Answer 1: `Film: dim light for watching television.`
- Answer 2: `Cozy: enough warm light to talk with guests.`
- Answer 3: `Bright: enough light to read or work.`

Connect the returned answer number to existing Homey lighting actions.

## Confidence and uncertainty

Simple cards default to 0.8 as their minimum. Choice and Score compare the API's confidence with this threshold. For Noul, the minimum is a probability: at 0.8 the card accepts yes for probabilities of at least 0.8, and no for probabilities of at most 0.2. Values between those boundaries throw an uncertainty error. Noul minimums must be between 0.51 and 1.

API errors, malformed answers and uncertainty stop the card. In Advanced Flow, connect the error path for fallback behavior. The yes/no action returns false for an accepted no; uncertainty produces an error instead.

The advanced card deliberately returns raw probabilities and confidence, including uncertain answers. Apply your own checks when consuming its JSON. Confidence is not a guarantee of correctness.

## Advanced JSON

Paste an object with `state` and `questions` into the advanced card. State can be text, an object or an array. The model comes from app settings; do not include `model`, an API key or other top-level fields.

```json
{
  "state": {
    "activity": "watching a film",
    "guests": true,
    "message": "The washing machine has finished."
  },
  "questions": {
    "scene": {
      "type": "choice",
      "instructions": "Which light scene fits?",
      "criteria": {
        "film": "Dim light for watching a film",
        "cozy": "Warm light for talking with guests",
        "bright": "Enough light to read or work"
      }
    },
    "notify": {
      "type": "noul",
      "instructions": "Should this message interrupt the current activity?"
    },
    "urgency": {
      "type": "score",
      "instructions": "How urgent is this message?",
      "criteria": ["Can wait", "Needs attention soon", "Requires immediate action"]
    }
  }
}
```

The **Answers (JSON)** tag contains an object keyed by `scene`, `notify` and `urgency`. Read `.scene.choice`, `.scene.confidence`, `.notify.noul` or `.urgency.score` with your preferred JSON tool. Apply thresholds before running actions. The advanced card does not create dynamic Homey tags for each question.

The app accepts 1–64 questions per request and a maximum of 64,000 characters for state plus questions. Question IDs use letters, digits, hyphens and underscores, starting with a letter or digit. Choice accepts 2–255 options; Score accepts 2–10 described levels. Instructions and descriptions can also be structured objects or arrays, following the [TypeSafe API](https://docs.typesafe.ai/api).

Use Flow tags in simple text fields without JSON escaping. In advanced JSON, inserted string values must be valid JSON strings with quotes and newlines escaped. Generate the entire JSON upstream when inputs can contain arbitrary text.

## Development and limits

Build and validation commands are in [AGENTS.md](AGENTS.md); [CLAUDE.md](CLAUDE.md) contains the Claude entry instructions. TypeSafe API access and credit are required for real evaluations and connection tests.

Requests time out after 10 seconds by default, with a limit of 30 calls per minute and four concurrent calls. Settings change the timeout and per-minute limit. Limits are shared across all cards and the connection test; requests are not retried automatically. Results stay local to each invocation, including simultaneous evaluations.

The app does not persist new state, questions, answers or evaluation history. Homey stores the configured cards in your Flows. The initial development version's saved-decision cards have been removed; any Flows built with those cards must be rebuilt with direct cards. The former yes/no condition has also been removed; replace it with the yes/no action and check its Answer tag in Advanced Flow. The old `jev_state` setting, if present on a development Homey, is ignored rather than automatically deleted.
