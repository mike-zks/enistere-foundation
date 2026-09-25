# Deployment

Packs et runbooks d'exécution de la Foundation, distincts des starters applicatifs.

- `staging/` : Compose et scripts opérationnels ;
- `docs/` : politiques, guides CI/registry, runbooks et preuves historiques ;
- `DEPLOYMENT_SPECIFICATION.md` : contrat actif.

Le contrat opérationnel par `deploymentUnit` est adopté par
[`ADR-089`](../docs/adr/ADR-089-operational-delivery-units.md) et son premier
schéma exécutable vit dans
[`factory/schema/deployment-unit.schema.json`](../factory/schema/deployment-unit.schema.json).

Les fichiers `.env` réels et secrets serveur ne doivent jamais être versionnés.
