# Roadmap

## Zambian local-language translation system
- [x] Language config (en, bem, nya, toi, loz) + provider chains
- [x] Supabase translations + translation_failures tables, RLS, indexes
- [x] Provider adapters: NLLB, Vambo, Jenga (interface only), Gemini fallback
- [x] Cache-first translation service with fallback chain + failure logging
- [x] Server functions (public cached read, admin generate/review)
- [x] Language context + persistence (localStorage)
- [x] Language selector in site header
- [x] Prominent language chooser on the front page (user request 4 Sep)
- [x] Admin translation management dashboard
- [x] Documentation: adding a language/provider

## Testing
- [ ] Submit a report in English, switch to ChiBemba, confirm the case page and action report still load
