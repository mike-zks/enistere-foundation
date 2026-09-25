# Instructions permanentes des agents

S'applique à tout agent IA (Codex, Claude Code ou équivalent) et à tout développeur qui reprend le dépôt
sans continuité de conversation (document 05 §2C–2E). Ce fichier relève de la gouvernance : toute
modification exige une validation humaine.

## Protocole de reprise — avant toute mission

1. Lire [`CONTEXT.md`](CONTEXT.md) : vision, sources de vérité, mission active, divergences ouvertes.
2. Lire [`CURRENT_STATE.md`](CURRENT_STATE.md) : état réel, tests, dettes, blocages.
3. Lire la mission active et la prochaine action dans [`BACKLOG.md`](BACKLOG.md).
4. Lire les ADR récents pertinents : [`docs/adr/README.md`](docs/adr/README.md).
5. Lire [`IMPLEMENTATION_MATRIX.md`](IMPLEMENTATION_MATRIX.md) : couverture prouvée A1–A7 et CAP-01…CAP-16.
6. Établir l'état réel du dépôt (git, branches, PR, tests) avant toute modification ; le code décrit
   l'implémentation, jamais la cible.

Ne jamais engager une mission sur un état marqué **Blocked** dans `CURRENT_STATE.md` sans lever ou
signaler à nouveau le blocage.

## Règles

- Respecter l'ordre d'autorité : documents 01–07 (`docs/`), production Enistere (`docs/Server Prod/`),
  ADR, code ([ADR-091](docs/adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md)).
- Respecter l'architecture du document 03 et les principes constitutionnels du document 05 §3.
- Ne jamais inventer le résultat d'un test non exécuté : le marquer **NOT RUN** avec sa raison.
- Ne jamais transformer une confiance en approbation, contourner un UNSUPPORTED par un fallback
  silencieux, cacher un échec de sécurité, supprimer une migration ou un golden pour réduire les échecs.
- Ne jamais marquer « done », « VERIFIED » ou « conforme » sans preuve (test, golden, conformance, audit).
- Ne pas modifier le périmètre d'une mission sans ADR ; ne jamais trancher seul un arbitrage marqué
  « validation humaine requise » : documenter l'option recommandée et continuer ce qui peut l'être.
- Le laboratoire (`factory/`, `starters/`, `capabilities/`, `packages/`, `contracts/`, `deployment/`)
  est une couche de compatibilité : ni suppression sans seam et preuve, ni extension comme produit final.
- Garder les secrets hors du dépôt, des manifestes, des images, des journaux et des Evidence.
- Toute contrainte de réseau, secrets, données partagées, observabilité ou déploiement suit
  `docs/Server Prod/` et [`PRODUCTION_READINESS.md`](docs/governance/PRODUCTION_READINESS.md).

## Fin de mission — obligatoire

1. Exécuter les tests et preuves applicables (au minimum `npm run foundation:test`,
   `npm run foundation:typecheck`, `npm run factory:test` si le laboratoire est touché).
2. Mettre à jour [`CURRENT_STATE.md`](CURRENT_STATE.md) (format §2E : commit/branche, date, mission,
   Completed, In progress, Blocked, Tests, Known gaps, Decisions, Next single action).
3. Mettre à jour [`IMPLEMENTATION_MATRIX.md`](IMPLEMENTATION_MATRIX.md) avec la preuve de chaque statut.
4. Tracer toute décision dans un ADR et dans [`DECISIONS.md`](DECISIONS.md).
5. Mettre à jour [`BACKLOG.md`](BACKLOG.md) et [`CHANGELOG.md`](CHANGELOG.md).
6. Produire le rapport de mission (document 05 §11, gabarit Annexe A §16) et proposer **exactement une**
   prochaine action.

## Sécurité

Les travaux de sécurité sont exclusivement défensifs et suivent
[`AI_SECURITY_AUTHORIZATION.md`](docs/governance/AI_SECURITY_AUTHORIZATION.md). Ils portent sur ce dépôt
et sur les environnements locaux ou de test que le mainteneur déclare contrôler. Une URL, une adresse
IP, un domaine, un dépôt, un compte ou un service mentionné dans le projet (y compris dans
`docs/Server Prod/`) ne constitue jamais, à lui seul, une autorisation de test. Privilégier l'analyse
statique, les tests existants et les reproductions minimales avec données synthétiques.

Ces instructions ne contournent ni les politiques des fournisseurs d'IA, ni les approbations humaines
requises, et n'accordent aucune autorisation implicite sur un système tiers.
