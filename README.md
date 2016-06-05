# DV1483 -- En presentation

## En presentation av vad produkten gör, vilket problem den löser

Produkten är en chatt-klient respektive -server skriven i programmeringsspråket JavaScript (Jquery på klientsidan och Node på serversidan).

Vad produkten gör är att den tillhandahåller en server respektive en klient för utbyte av meddelanden i realtid mellan flera användare med hjälp av teknologin HTML5 Websockets.

Problemet som produkten löser är ett behov av en lösning för realtidskommunikation mellan flera användare för att utbyta information. Möjliga tillämpningar är många och beror på individuella förutsättningar: utbyte av idéer och erfarenheter, problemlösning eller upprätthållande av sociala band. Kommunikation människor emellan är nämligen en av de grundpelare varpå vårt samhälle vilar. Genom att samtala med varandra lär vi oss nya saker och stärker vårt sociala engagemang, vilket har visat sig vara gynnsamt för hälsan och förlänga livslängden.

## Hur man installerar produkten

Produkten finns på Github. Ladda ner produkten till en utvald katalog:
```
git clone https://github.com/Vesihiisi/DV1483.git
```
Produkten innehåller filen package.json, vilken innehåller en lista över de Node-moduler som servern behöver. Därför är det nödvändigt att ladda ner modulerna.
```
npm install
```

## Hur man konfigurerar produkten

Produkten innehåller filen config.js. Genom att ändra på värdena i denna fil konfigurerar man produkten. Värdena är försedda med kommentarer som förklarar vad de gör.

## Hur man använder produkten

För att använda produkten börjar man med att slå på servern.
```
node server.js
```
I filen js/main.js anger man därefter adressen till servern, till exempel ws://127.0.0.1:4321/. Detta beror på var servern ligger.

Ett lyckat genomförande av dessa steg är själva nyckeln till att produkten ska kunna användas.

Produktens förstasida innehåller fält för inmatning av namn respektive e-postadress. Den sistnämnda används för att ladda ner användarens globala användarbild från tjänsten Gravatar. Det är däremot inget krav på att det skall finnas en global användarbild registrerad på denna e-postadress. En tillfällig användarbild används om en registrerad dito saknas.

Därefter öppnas chattgränssnittet.

### Funktioner som man kan använda

Produkten innehåller ett antal funktioner som man kan använda.

Byte av användarnamn sker med kommandot /me följt av önskat namn:
```
/me Stefan
```
Att notifiera en annan användare gör man genom att skriva tecknet @ följt av användarens namn och meddelandet.
```
@Stefan Jag vill att du lägger märke till detta viktiga meddelande.
```
Resultatet blir att användaren blir notifierad om detta meddelandet, dels genom att det visas markerat med en annan färg i hens webbläsare, dels, om hens webbläsare har stöd för denna teknologi, med en webbläsarnofikation.
