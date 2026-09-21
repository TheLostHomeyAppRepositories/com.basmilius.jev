Jev aide vos Homey Flows à prendre des décisions selon la situation à la maison. Choisissez une scène lumineuse adaptée, décidez si une notification peut attendre ou évaluez le besoin d’éclairage supplémentaire.

Vous décrivez vous-même la situation avec du texte et des tags Flow. Jev utilise uniquement le contexte fourni. L’app ne lit pas vos appareils et ne crée pas d’inventaire de votre maison.

Quatre cartes d’action :
- Posez une question oui/non et obtenez une réponse booléenne avec la probabilité de oui.
- Choisissez dans une liste de 2 à 255 réponses, une par ligne.
- Évaluez une situation selon trois niveaux que vous décrivez. Le score va de 0 à 2, décimales comprises.
- Utilisez la carte JSON avancée pour des états et des questions structurés.

Utilisez les tags de résultat dans Advanced Flow pour déterminer les actions suivantes. Les cartes simples ont un seuil réglable. En cas d’incertitude, elles empruntent le chemin d’erreur, auquel vous pouvez connecter une solution de repli.

Prérequis :
- Un Homey local avec la version 12.4 ou ultérieure.
- Un compte TypeSafe avec une clé API et du crédit.
- Un accès Internet. Le contexte et les questions fournis sont envoyés à TypeSafe pour évaluation.
- Advanced Flow pour relier les tags de résultat à d’autres cartes.

Ajoutez votre clé API dans les paramètres de l’app. Configurez les questions et les réponses directement sur les cartes Flow.
