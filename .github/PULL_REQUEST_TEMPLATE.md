# Pull Request

## Résumé

Décrire brièvement le changement.

## Mission et capacité

- **Mission** : (E0 … E10 — voir [`BACKLOG.md`](../BACKLOG.md))
- **Contrats / capacités** : (A1–A7, CAP-01 … CAP-16 — voir [`IMPLEMENTATION_MATRIX.md`](../IMPLEMENTATION_MATRIX.md))
- **ADR** : (ex. ADR-092 — ou « ADR à rédiger »)

## Core concerné (laboratoire)

- [ ] kernel/contracts (E0)
- [ ] goldens
- [ ] api-nestjs
- [ ] api-spring
- [ ] mobile-react-native
- [ ] mobile-flutter
- [ ] web-nextjs
- [ ] web-angular
- [ ] cloud
- [ ] ui-kit
- [ ] ai-core
- [ ] docs-core
- [ ] quality-core
- [ ] repo/global

## Type de changement

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Refactor
- [ ] Test
- [ ] Security
- [ ] CI/CD
- [ ] Breaking change

## Quality gates

> Référence : [`docs/checklists/PR_QUALITY_CHECKLIST.md`](../docs/checklists/PR_QUALITY_CHECKLIST.md)
> Script : `node factory/quality/scripts/quality-gates.mjs plan <scope>`

### Scope applicable

- [ ] `docs` — docs-only (`git diff --check`)
- [ ] `packages` — api-contracts + api-client-fetch
- [ ] `ui-kit` — typecheck / lint / test / build / tokens:check
- [ ] `web` — typecheck / lint / test / build
- [ ] `mobile-static` — typecheck / lint / test / doctor
- [ ] `root-audit` — `npm audit`
- [ ] `all-safe` — packages + ui-kit + web + root-audit (recommandé pré-PR)
- [ ] autre / runtime — décrire dans "Commandes exécutées"

### Commandes exécutées

```
# Indiquer les commandes réellement exécutées et leurs résultats
# Exemple :
# node factory/quality/scripts/quality-gates.mjs run all-safe  → 17/17 ✓
# git diff --check                                                  → 0 whitespace error
# npm audit                                                         → 0 vulnérabilité
```

### Gates non exécutés

| Gate | Raison de l'exclusion |
|---|---|
| (exemple : expo export -p ios) | (machine Linux — bloqué RN31) |

## Hors périmètre confirmé

- [ ] Aucun workflow GitHub modifié (`.github/workflows/*.yml` intacts)
- [ ] Aucune dépendance ajoutée sans justification
- [ ] Aucun secret, token, URL signée dans le diff

## Sécurité

- [ ] Aucun secret ajouté (env, credentials, clé privée, token)
- [ ] Pas de logs sensibles (PII, tokens, URL signées, mots de passe)
- [ ] Dépendances justifiées si ajoutées (`npm audit` 0 vuln)
- [ ] Impact sécurité vérifié (auth, CSRF, Origin, RBAC si applicable)

## Statut / gouvernance

> Protocole de continuité : [`AGENTS.md`](../AGENTS.md). Obligatoire en fin de mission.

- [ ] `CURRENT_STATE.md` mis à jour (état réel, tests exécutés et NOT RUN)
- [ ] `IMPLEMENTATION_MATRIX.md` mis à jour avec preuve (aucun VERIFIED sans Evidence)
- [ ] `DECISIONS.md` et ADR mis à jour si une décision est prise
- [ ] `BACKLOG.md` : mission active et prochaine action unique

## Documentation

- [ ] README mis à jour si nécessaire
- [ ] CHANGELOG mis à jour si nécessaire
- [ ] ADR ajouté si nécessaire
- [ ] Documentation du core mise à jour si nécessaire

## Risques

Décrire les risques, limites ou migrations nécessaires.

## Checklist finale

- [ ] Périmètre respecté
- [ ] Gates minimaux verts (locaux)
- [ ] Documentation claire
- [ ] Revue humaine prévue
