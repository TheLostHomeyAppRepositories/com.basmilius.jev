Jev helps your Homey Flows make decisions based on what is happening at home. Choose a suitable lighting scene, decide whether a notification can wait, or assess how much extra light is needed.

You describe the situation yourself with text and Flow tags. Jev uses only the context you provide. The app does not read your devices or build a snapshot of your home.

Four action cards:
- Ask a yes/no question and receive a boolean answer and the probability of yes.
- Choose from a list of 2 to 255 answers, one per line.
- Score a situation against three levels you describe. Scores range from 0 to 2, including fractions.
- Use the advanced JSON card for structured state and questions.

Use the result tags in Advanced Flow to determine what happens next. Simple cards have an adjustable acceptance threshold. When the answer is uncertain, they follow the error path, where you can connect a fallback action.

Requirements:
- A local Homey running version 12.4 or newer.
- A TypeSafe account with an API key and credit.
- Internet access. The context and questions you supply are sent to TypeSafe for evaluation.
- Advanced Flow to connect result tags to other cards.

Add your API key in the app settings. Configure questions and answers directly on your Flow cards.
