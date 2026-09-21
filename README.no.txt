Jev hjelper dine Homey Flows med å ta beslutninger ut fra situasjonen hjemme. Velg en passende lysscene, avgjør om et varsel kan vente, eller vurder behovet for ekstra lys.

Du beskriver selv situasjonen med tekst og Flow-tagger. Jev bruker bare konteksten du oppgir. Appen leser ikke enhetene dine og lager ingen oversikt over hjemmet ditt.

Fire handlingskort:
- Still et ja/nei-spørsmål og få et boolsk svar og sannsynligheten for ja.
- Velg fra en liste med 2 til 255 svar, ett per linje.
- Vurder en situasjon ut fra tre nivåer du selv beskriver. Poengsummen går fra 0 til 2 med desimaler.
- Bruk det avanserte JSON-kortet for strukturerte tilstander og spørsmål.

Bruk resultattaggene i Advanced Flow til å bestemme de neste handlingene. De enkle kortene har en justerbar terskel. Ved usikkerhet følger de feilbanen, der du kan koble til en alternativ handling.

Krav:
- En lokal Homey med versjon 12.4 eller nyere.
- En TypeSafe-konto med API-nøkkel og kreditt.
- Internettilgang. Konteksten og spørsmålene du oppgir, sendes til TypeSafe for vurdering.
- Advanced Flow for å koble resultattagger til andre kort.

Legg til API-nøkkelen i appinnstillingene. Spørsmål og svar konfigureres direkte på Flow-kortene.
