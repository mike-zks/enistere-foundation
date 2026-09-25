# Contribuer à Enistere Foundation

Lire d'abord [`AGENTS.md`](AGENTS.md) (protocole de reprise, valable pour les humains comme pour les
agents) et [`CONTEXT.md`](CONTEXT.md).

## Missions

Le travail est découpé en missions courtes E0 → E10 (document 06, [`ROADMAP.md`](ROADMAP.md)). Chaque
mission commence par MISSION ID, OBJECTIF, IN/OUT OF SCOPE, BASELINE GIT, CONTRATS/ADR IMPACTÉS, CRITÈRES
DE PASS et se termine par le rapport du document 05 §11 (gabarit Annexe A §16), consigné dans
[`CURRENT_STATE.md`](CURRENT_STATE.md).

## Branches et commits

- Une branche dédiée par mission ; jamais de force-push sur une branche partagée ; jamais de merge,
  publication ou suppression de branche distante sans autorisation.
- Un commit = une unité explicable. Ne pas mélanger refactor massif, fonctionnalité, documentation et
  montée de dépendances sans nécessité.
- Messages : `type(portée): résumé` (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`),
  en français ou en anglais, à l'impératif.
- Avant commit : tests pertinents, relecture du diff, fichiers générés identifiés, recherche de secrets.

## Pull requests

Utiliser [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Indiquer les commandes
réellement exécutées, les gates **NOT RUN** et leur raison, la mission et les contrats ou capacités
concernés.

## Tests

| Zone | Commandes |
|---|---|
| Kernel E0 et goldens | `npm run foundation:typecheck` · `npm run foundation:test` · `npm run golden:asteria:update` puis diff vide |
| Outillage du dépôt | `npm run tools:test` · `npm run secrets:allowlist` · `npm audit --audit-level=high` |
| Documentation | `npm run docs:links` |

Aucune capacité n'est déclarée VERIFIED sans preuve ; aucun golden ni migration n'est supprimé pour faire
passer une suite.

## Documentation et décisions

Toute décision structurante est un ADR (`docs/adr/`) résumé dans [`DECISIONS.md`](DECISIONS.md). Ne jamais
committer de secret, jeton, clé privée ou donnée personnelle.
