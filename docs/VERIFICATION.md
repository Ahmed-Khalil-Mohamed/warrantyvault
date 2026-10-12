# WarrantyVault: local verification

Observed on Windows on 12 October 2026 with Node 25.5.0, npm 11.7.0 and Chromium from the pinned Playwright installation.

| Check                                                         | Observed result                                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent dependency installation                           | Passed in this repository                                                                                                                           |
| TypeScript strict check and production build                  | Passed                                                                                                                                              |
| Domain, editing, HTTP and storage tests                       | 7 passed                                                                                                                                            |
| Browser scenarios                                             | 5 passed                                                                                                                                            |
| English, Arabic and dark-theme automated accessibility checks | No WCAG A/AA violations detected by the configured axe checks                                                                                       |
| Responsive checks                                             | 375, 414, 768, 1024 and 1440px                                                                                                                      |
| Dependency audit                                              | 0 known vulnerabilities reported                                                                                                                    |
| Runtime independence                                          | Separate process, SQLite file and session cookie; foreign sessions and project routes rejected                                                      |
| Windows portable build                                        | Built; seven embedded icon sizes verified; executable launch, renderer title, native identity, entries API and startup-banner closure checks passed |

Browser checks exercise creation, persistence, safe edits, search, CSV download and the product workflow. The interface was inspected using actual English, Arabic, mobile and dark screenshots under `docs/screenshots`. Product navigation lives in `src/layout.tsx`; independent workflow compositions and record components live in `src/experience.tsx`, with responsive styles in `src/design.css`. Each project documents its own direction in `DESIGN.md`. The old dashboard style files were removed. The Tools disclosure is exercised before export. The calendar and topic-library filters have browser coverage. All rendered images are checked for successful loading.

## Limits of this evidence

These results cover the checked cases, not a guarantee that every defect is absent. Automated accessibility checks do not replace a full assistive-technology review. Production deployment and the Docker image have not been executed here. Hosted CI results are available in the repository Actions tab. Sample data is fictional. The independent repository is [Ahmed-Khalil-Mohamed/warrantyvault](https://github.com/Ahmed-Khalil-Mohamed/warrantyvault).

The Windows build is unsigned and portable. Native smoke testing does not cover every OS dialog or an installer/update flow. FileNest move/undo safety has dedicated filesystem tests; the real folder-picker UI was not automated.
