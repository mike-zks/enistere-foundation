# Factory AI Runtime (laboratoire)

Primitives IA du laboratoire, conservées comme **candidates à extraction** vers l'AI Gateway / Agent
Runtime de la cible (document 03, CAP-11) : construction de contexte, rédaction de secrets, citations de
sources, harnais d'évaluation, fournisseur factice, modèle et validateur de registre de prompts.

```bash
node --test factory/ai/runtime/test/*.test.mjs
```

Les prompts gouvernés, le registre réel et sa gouvernance ont été archivés sous
[`docs/archive/laboratory/`](../../../docs/archive/README.md) (ADR-093) : ils visaient la génération de
starters et référençaient des documents supprimés. Une IA de la cible n'obtient jamais DECIDE ni VERIFY
(documents 02 et 03).

Voir `AI_RUNTIME_SPECIFICATION.md` et `docs/architecture/AI_GOVERNANCE_AND_AGENT_ARCHITECTURE.md`.
