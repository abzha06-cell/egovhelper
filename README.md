# Мемлекеттік қызметтер көмекшісі

ЖИ (Google Gemini) негізіндегі көмекші: eGov қызметтері туралы сұрақтарға жауап береді.

- `index.html` – сайттың беті
- `api/chat.js` – Gemini API-ге сұрау жіберетін серверлік функция (Vercel)

Vercel-де Environment Variables бөліміне `GEMINI_API_KEY` қосу керек.
Қаласаңыз, `GEMINI_MODEL` арқылы модельді ауыстыруға болады (әдепкі: gemini-flash-latest).
