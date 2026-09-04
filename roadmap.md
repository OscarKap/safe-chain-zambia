# Roadmap

## Zambian local-language translation system
- [x] Language config (en, bem, nya, toi, loz) + provider chains
- [x] Supabase translations + translation_failures tables, RLS, indexes
- [x] Provider adapters: NLLB, Vambo, Jenga (interface only), Gemini fallback
- [x] Cache-first translation service with fallback chain + failure logging
- [ ] Server functions (public cached read, admin generate/review)
- [ ] Language context + persistence (localStorage, profile-aware)
- [ ] Language selector in site header
- [ ] Prominent language chooser on the front page (user request 4 Sep)
- [ ] Admin translation management dashboard
- [ ] Documentation: adding a language/provider
