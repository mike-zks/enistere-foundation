# CI — workflows GitHub Actions

Un seul workflow, [`ci.yml`](ci.yml) (ADR-094, ADR-096) : **lecture seule** (`permissions: contents: read`), sans
secret GitHub, sans déploiement, sans registry ni publication. Déclenché sur toute `pull_request` et sur
`push` vers `main` ; `concurrency` annule les exécutions obsolètes.

| Job (check requis) | Vérifie |
|---|---|
| `kernel` | `npm ci` · typecheck de tous les workspaces (`kernel/*`, `engine/*`, `extensions/runtimes/*`, `surfaces/*`, `goldens`) · tous les tests · golden Asteria régénéré à l'identique |
| `adapters` | matérialisation du golden Asteria avec les extensions réelles (code 2 attendu : PARTIAL) · `verify --toolchain` : structure, install, build, démarrage + `/health`, audit · export de la proof chain puis `verify-bundle` (E4) · EvidenceRecords et proof chain en artefacts |
| `secret-scan` | tests de `tools/quality/` · allowlist gitleaks justifiée et non expirée · gitleaks 8.30.1 (checksum vérifié) sur tout l'historique, sortie censurée |
| `docs` | aucun lien interne mort dans la documentation vivante (`docs/archive/` exclu) |
| `audit` | `npm audit --audit-level=high` |

Les noms de jobs sont les checks requis du ruleset `protect-main` : les renommer bloque toute PR.

## Reproduire en local

```bash
npm ci
npm run foundation:typecheck && npm run foundation:test
npm run golden:asteria:update && git status --porcelain goldens/
npm run tools:test && npm run secrets:allowlist && npm run docs:links
npm audit --audit-level=high
# job adapters
node surfaces/cli/src/cli.ts materialize goldens/asteria/contracts goldens/asteria/evidence --extensions extensions --out /tmp/ws
node surfaces/cli/src/cli.ts verify /tmp/ws --extensions extensions --toolchain --evidence-out /tmp/evidence
node surfaces/cli/src/cli.ts export goldens/asteria/contracts goldens/asteria/evidence --extensions extensions \
  --workspace /tmp/ws --evidence /tmp/evidence --out /tmp/proof-chain.json
node surfaces/cli/src/cli.ts verify-bundle /tmp/proof-chain.json
```

La CI de l'itération précédente (starters, golden runtime, images) a été supprimée avec son code
(ADR-094) ; elle reste consultable dans l'historique Git au commit `f2590a8`.
