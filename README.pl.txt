Jev pomaga Twoim Homey Flow podejmować decyzje na podstawie sytuacji w domu. Wybierz odpowiednią scenę oświetlenia, zdecyduj, czy powiadomienie może poczekać, lub oceń potrzebę dodatkowego światła.

Samodzielnie opisujesz sytuację tekstem i znacznikami Flow. Jev korzysta wyłącznie z podanego kontekstu. Aplikacja nie odczytuje urządzeń ani nie tworzy obrazu całego domu.

Cztery karty akcji:
- Zadaj pytanie tak/nie i otrzymaj odpowiedź logiczną oraz prawdopodobieństwo odpowiedzi tak.
- Wybierz z listy od 2 do 255 odpowiedzi, po jednej w wierszu.
- Oceń sytuację na trzech samodzielnie opisanych poziomach. Ocena mieści się w zakresie od 0 do 2, również z wartościami ułamkowymi.
- Użyj zaawansowanej karty JSON do uporządkowanych stanów i pytań.

Używaj znaczników wyników w Advanced Flow, aby określać kolejne akcje. Proste karty mają regulowany próg. Przy niepewności wybierają ścieżkę błędu, do której możesz podłączyć alternatywną akcję.

Wymagania:
- Lokalny Homey z wersją 12.4 lub nowszą.
- Konto TypeSafe z kluczem API i środkami.
- Dostęp do Internetu. Podany kontekst i pytania są wysyłane do TypeSafe w celu oceny.
- Advanced Flow do łączenia znaczników wyników z innymi kartami.

Dodaj klucz API w ustawieniach aplikacji. Pytania i odpowiedzi konfigurujesz bezpośrednio na kartach Flow.
