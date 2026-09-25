# Deployment (laboratoire)

Statut : **couche de compatibilité** ([ADR-091](../docs/adr/ADR-091-foundation-dossier-authority-and-laboratory-status.md),
[ADR-093](../docs/adr/ADR-093-r0c-repository-realignment.md)).

- `DEPLOYMENT_SPECIFICATION.md` : modèle des unités de livraison du laboratoire
  ([ADR-089](../docs/adr/ADR-089-operational-delivery-units.md)), dont le schéma exécutable
  [`factory/schema/deployment-unit.schema.json`](../factory/schema/deployment-unit.schema.json) reste testé.

Toute livraison réelle suit la production Enistere — [`docs/Server Prod/`](../docs/Server%20Prod/README.md) —
et [`PRODUCTION_READINESS.md`](../docs/governance/PRODUCTION_READINESS.md), qui prévalent sur ce dossier.
Le staging du laboratoire (Compose, scripts, rapports CC10/CC11, politiques registry et secrets) n'était pas
conforme à cette production (réseau `web`, résolveur de certificats propre, PostgreSQL et MinIO embarqués) :
il est archivé sous [`docs/archive/laboratory/deployment/`](../docs/archive/README.md).

Les fichiers `.env` réels et les secrets serveur ne doivent jamais être versionnés.
