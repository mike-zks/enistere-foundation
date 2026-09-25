# Registre des ADR

Toute décision d'architecture, de produit ou de dérogation à un document canonique est un ADR daté et
attribué, versionné ici, et résumé dans [`DECISIONS.md`](../../DECISIONS.md). Une décision non tracée
n'existe pas pour la mission suivante (document 05 §2C).

## Autorité

Les ADR se placent sous les documents 01–04 et la documentation de production Enistere, et au-dessus du
code (document 05 §2.3, [ADR-091](ADR-091-foundation-dossier-authority-and-laboratory-status.md)).
Ajout libre ; suppression ou réécriture d'un ADR accepté = validation humaine (document 05 §2F).

## Registre actif

| ADR | Titre | Statut |
|---|---|---|
| [ADR-073](ADR-073-secret-scanning.md) | Analyse de secrets bloquante (gitleaks, allowlist justifiée) | Accepté ; amendé par ADR-094 |
| [ADR-091](ADR-091-foundation-dossier-authority-and-laboratory-status.md) | Le dossier 01–07 fait autorité | Accepté ; amendé par ADR-094 |
| [ADR-092](ADR-092-e0-contract-foundation.md) | E0 Contract Foundation : sept contrats et primitives partagées | Accepté ; P1–P10 validés ; amendé par ADR-094 |
| [ADR-093](ADR-093-r0c-repository-realignment.md) | Mission R0-C « Repository Realignment » entre E0 et E1, et nommage | Accepté ; amendé par ADR-094 |
| [ADR-094](ADR-094-clean-slate.md) | Repartir propre : suppression de l'itération précédente | Accepté |
| [ADR-095](ADR-095-e1-kernel-facade.md) | E1 Kernel Façade : chaîne de compilation native, catalogue d'extensions en données | Accepté |
| [ADR-096](ADR-096-adapter-protocol-v0.md) | Adapter Protocol v0 et premier adapter NestJS | Accepté |

Les ADR 001–090 de l'itération précédente (sauf ADR-073) sont archivés dans
[`archive/laboratory/adr/`](../archive/laboratory/adr/) : histoire, sans autorité (ADR-094). La
numérotation continue à partir d'ADR-097.

## Gabarit

```markdown
# ADR-NNN — Titre décisionnel

- Statut : Proposé | Accepté | Supersédé par ADR-XXX
- Date : AAAA-MM-JJ
- Décideur : rôle (document 05 §2F)
- Sources : documents du dossier, ADR liés

## Contexte
## Options (KEEP / ADAPT / EXTRACT / REPLACE / RETIRE si réforme)
## Décision
## Conséquences
## Validation humaine requise (le cas échéant)
```
