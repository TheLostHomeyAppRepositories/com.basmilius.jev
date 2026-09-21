Jev hjælper dine Homey Flows med at træffe beslutninger ud fra situationen derhjemme. Vælg en passende lysscene, afgør om en besked kan vente, eller vurder behovet for ekstra lys.

Du beskriver selv situationen med tekst og Flow-tags. Jev bruger kun den kontekst, du angiver. Appen læser ikke dine enheder og laver ikke en oversigt over dit hjem.

Fire handlingskort:
- Stil et ja/nej-spørgsmål og få et boolesk svar samt sandsynligheden for ja.
- Vælg fra en liste med 2 til 255 svar, ét pr. linje.
- Vurder en situation ud fra tre niveauer, som du selv beskriver. Scoren går fra 0 til 2 med decimaler.
- Brug det avancerede JSON-kort til strukturerede tilstande og spørgsmål.

Brug resultaternes tags i Advanced Flow til at bestemme de næste handlinger. De enkle kort har en justerbar tærskel. Ved usikkerhed følger de fejlstien, hvor du kan tilslutte en alternativ handling.

Krav:
- En lokal Homey med version 12.4 eller nyere.
- En TypeSafe-konto med API-nøgle og kredit.
- Internetadgang. Den angivne kontekst og spørgsmålene sendes til TypeSafe til vurdering.
- Advanced Flow til at forbinde resultattags med andre kort.

Tilføj din API-nøgle i appens indstillinger. Spørgsmål og svar opsættes direkte på Flow-kortene.
