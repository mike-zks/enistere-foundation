# Pull Request

## Résumé

Décrire brièvement le changement.

## Mission et capacité

- **Mission** : (E0 … E10 — voir [`BACKLOG.md`](../BACKLOG.md))
- **Contrats / capacités** : (A1–A7, CAP-01 … CAP-16 — voir [`IMPLEMENTATION_MATRIX.md`](../IMPLEMENTATION_MATRIX.md))
- **ADR** : (ex. ADR-092 — ou « ADR à rédiger »)

## Zone concernée (document 03)

- [ ] Kernel (`kernel/`)
- [ ] Goldens (`goldens/`)
- [ ] Outillage du dépôt (`tools/`)
- [ ] CI (`.github/`)
- [ ] Documentation / gouvernance

## Type de changement

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Refactor
- [ ] Test
- [ ] Security
- [ ] CI/CD
- [ ] Breaking change

## Vérifications

> Référence : [`.github/workflows/README.md`](workflows/README.md) (les quatre checks requis).

### Commandes exécutées

```
# Indiquer les commandes réellement exécutées et leurs résultats, par exemple :
# npm run foundation:typecheck && npm run foundation:test   → 56/56 ✓
# npm run golden:asteria:update && git status goldens/      → aucun changement
# npm run tools:test && npm run docs:links                  → ✓
# npm audit --audit-level=high                              → 0 vulnérabilité
```

### Gates non exécutés

| Gate | Raison de l'exclusion |
|---|---|
| (exemple : gitleaks) | (binaire indisponible en local — exécuté en CI) |

## Hors périmètre confirmé

- [ ] Aucun workflow GitHub modifié (`.github/workflows/*.yml` intacts)
- [ ] Aucune dépendance ajoutée sans justification
- [ ] Aucun secret, token, URL signée dans le diff

## Sécurité

- [ ] Aucun secret ajouté (env, credentials, clé privée, token)
- [ ] Pas de logs sensibles (PII, tokens, URL signées, mots de passe)
- [ ] Dépendances justifiées si ajoutées (`npm audit` 0 vuln)
- [ ] Impact sécurité vérifié (autorité DECIDE/VERIFY, Evidence, secrets)

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
- [ ] Documentation de la zone mise à jour si nécessaire

## Risques

Décrire les risques, limites ou migrations nécessaires.

## Checklist finale

- [ ] Périmètre respecté
- [ ] Gates minimaux verts (locaux)
- [ ] Documentation claire
- [ ] Revue humaine prévue
