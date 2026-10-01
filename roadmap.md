# Roadmap

## Uploaded youth photography
- [x] Replace home, About, and most Learning Hub images with the supplied African youth photos on desktop and mobile; retain safety-specific illustrations and partner marks.

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
