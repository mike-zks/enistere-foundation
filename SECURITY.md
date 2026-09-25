# Politique de sécurité

## Signaler une vulnérabilité

Ne publiez aucun détail de vulnérabilité dans une issue, une PR ou une discussion publique. Utilisez le
signalement privé de vulnérabilité GitHub du dépôt (« Security » → « Report a vulnerability ») ou, à
défaut, contactez les propriétaires listés dans [`CODEOWNERS`](CODEOWNERS). Un accusé de réception est
attendu sous 5 jours ouvrés ; la correction et la divulgation sont coordonnées avec le rapporteur.

N'incluez jamais de secret réel, de donnée personnelle ou d'identifiant de production dans un signalement.

## Périmètre

- Code de ce dépôt : Kernel (`kernel/`), goldens (`goldens/`), outillage (`tools/`), workflows CI.
- Hors périmètre : l'infrastructure partagée Enistere (voir `docs/Server Prod/`) et tout système tiers.
  Aucune mention d'hôte, domaine ou service dans ce dépôt ne vaut autorisation de test
  ([`AI_SECURITY_AUTHORIZATION.md`](docs/governance/AI_SECURITY_AUTHORIZATION.md)).

## Garde-fous en place

- Recherche de secrets sur tout l'historique (gitleaks épinglé et vérifié, ADR-073) avec exceptions
  justifiées et datées (`.gitleaks.toml`).
- Audit des dépendances en CI (`npm audit --audit-level=high`), sans exception.
- Contrats E0 : aucun secret dans les modèles ni les Evidence (`EVIDENCE_SECRET_IN_URI`), références
  de secrets par SecretRef uniquement (document 03 §4.11) ; l'IA ne peut ni décider ni vérifier.

## Risques

Les risques et hypothèses de sécurité sont suivis dans
[`docs/governance/RISK_REGISTER.md`](docs/governance/RISK_REGISTER.md). Les critères d'admission en
production sont dans [`docs/governance/PRODUCTION_READINESS.md`](docs/governance/PRODUCTION_READINESS.md).
