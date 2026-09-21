Jev hjälper dina Homey Flows att fatta beslut utifrån situationen hemma. Välj en passande ljusscen, avgör om ett meddelande kan vänta eller bedöm behovet av extra ljus.

Du beskriver själv situationen med text och Flow-taggar. Jev använder bara den kontext du anger. Appen läser inte dina enheter och skapar ingen översikt över ditt hem.

Fyra åtgärdskort:
- Ställ en ja/nej-fråga och få ett booleskt svar samt sannolikheten för ja.
- Välj från en lista med 2 till 255 svar, ett per rad.
- Bedöm en situation utifrån tre nivåer som du själv beskriver. Poängen går från 0 till 2 med decimaler.
- Använd det avancerade JSON-kortet för strukturerade tillstånd och frågor.

Använd resultattaggarna i Advanced Flow för att bestämma nästa åtgärder. De enkla korten har en justerbar tröskel. Vid osäkerhet följer de felvägen, där du kan koppla in en alternativ åtgärd.

Krav:
- En lokal Homey med version 12.4 eller senare.
- Ett TypeSafe-konto med API-nyckel och kredit.
- Internetanslutning. Den kontext och de frågor du anger skickas till TypeSafe för bedömning.
- Advanced Flow för att koppla resultattaggar till andra kort.

Lägg till din API-nyckel i appinställningarna. Frågor och svar konfigureras direkt på Flow-korten.
