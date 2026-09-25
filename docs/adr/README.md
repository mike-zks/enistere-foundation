# Registre des ADR

Toute décision d'architecture, de produit ou de dérogation à un document canonique est un ADR daté et
attribué, versionné ici, et résumé dans [`DECISIONS.md`](../../DECISIONS.md). Une décision non tracée
n'existe pas pour la mission suivante (document 05 §2C).

## Autorité

Les ADR se placent sous les documents 01–04 et la documentation de production Enistere, et au-dessus du
code (document 05 §2.3, [ADR-091](ADR-091-foundation-dossier-authority-and-laboratory-status.md)).
Ajout libre ; suppression ou réécriture d'un ADR accepté = validation humaine (document 05 §2F).

## Périodes

| Plage | Période | Portée actuelle |
|---|---|---|
| ADR-001 → ADR-043 | Laboratoire V1 (starters, cores, CI) | Historique ; valide pour les actifs concernés sauf supersession explicite |
| ADR-044 → ADR-090 | Laboratoire V2 (pipeline Blueprint → CSM → plan, runtimes, capabilities) | Valide **pour la couche de compatibilité** (ADR-091) |
| ADR-091 → | Enistere Foundation (dossier 01–07) | Cible produit et missions E0 → E10 |

## ADR de la reprise

| ADR | Titre | Statut |
|---|---|---|
| [ADR-091](ADR-091-foundation-dossier-authority-and-laboratory-status.md) | Le dossier 01–07 fait autorité ; le laboratoire devient couche de compatibilité | Accepté |
| [ADR-092](ADR-092-e0-contract-foundation.md) | E0 Contract Foundation : sept contrats et primitives partagées | Accepté ; P1–P10 à valider |

Backlog historique des ADR du laboratoire : [`ADR_BACKLOG.md`](ADR_BACKLOG.md).

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
