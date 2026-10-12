# Contributing to WarrantyVault

For keeping purchase dates, coverage and claim progress together on your own computer. Improvements should make this workflow easier to complete without weakening its rules.

## Report a problem

Search [existing issues](https://github.com/Ahmed-Khalil-Mohamed/warrantyvault/issues) first, then use a bug or feature form. Arabic and English are welcome. Describe a concrete action and result. Include the app version, operating system, language and theme, and browser version when relevant. Remove real names, private paths, database files, passwords, tokens and private financial records from attachments. Report security concerns through [SECURITY.md](SECURITY.md).

## Work on a change

1. Fork the repository and create a focused branch.
2. Install Node.js 24+ and run `npm ci`.
3. Make a small change with matching English and Arabic text. Preserve RTL, keyboard access and dark mode.
4. Test behavior at the domain/API boundary when changing workflow rules. Add a browser scenario when introducing a new user journey.
5. Run `npm run format`, `npm run check`, then `npx playwright install chromium` and `npm run test:e2e`.
6. Open a pull request describing the user problem, the result and the checks actually performed. Include interface screenshots when changing layout.

For desktop changes, also run `npm run package:windows` and `npm run test:native` on Windows.

The product rules live in `apps/warrantyvault/domain.ts`, request validation in `server/`, and the interface in `src/`. Read [DESIGN.md](DESIGN.md) before changing the visual language. Asset additions need provenance and a redistributable license.

## بالعربي

البلاغات والاقتراحات بالعربي مرحب بها. اشرح الخطوات والنتيجة المتوقعة والنتيجة الفعلية، واستخدم بيانات تجريبية. أي تغيير في الواجهة لازم يراعي العربي والإنجليزي واتجاه RTL ولوحة المفاتيح.

By contributing, you agree to license your contribution under this repository's MIT license. Be respectful and keep feedback specific to the work.
