# @enistere/foundation-kernel-contracts — E0 Contract Foundation

Première brique du **Foundation Kernel** (document 03) : les huit contrats de première classe de la cible
et leurs primitives partagées ([ADR-092](../../docs/adr/ADR-092-e0-contract-foundation.md) ; A8 :
[ADR-098](../../docs/adr/ADR-098-materialization-record-and-proof-chain.md)). Générique,
headless, déterministe, sans dépendance à un framework cible, un cloud ou un LLM.

## Contrats

| Code | Kind | Classe | Plan | Schéma |
|---|---|---|---|---|
| A1 | `RequirementBaseline` | AUTHORITATIVE | Desired | [`requirement-baseline.schema.json`](schemas/v1alpha1/requirement-baseline.schema.json) |
| A2 | `DecisionSet` | AUTHORITATIVE | Desired | [`decision-set.schema.json`](schemas/v1alpha1/decision-set.schema.json) |
| A3 | `EffectiveOrganizationContext` | DERIVED | Derived | [`effective-organization-context.schema.json`](schemas/v1alpha1/effective-organization-context.schema.json) |
| A4 | `SystemDefinition` | AUTHORITATIVE | Desired | [`system-definition.schema.json`](schemas/v1alpha1/system-definition.schema.json) |
| A5 | `DomainContract` | AUTHORITATIVE | Desired | [`domain-contract.schema.json`](schemas/v1alpha1/domain-contract.schema.json) |
| A6 | `ChangeRequest` | AUTHORITATIVE | Desired | [`change-request.schema.json`](schemas/v1alpha1/change-request.schema.json) |
| A7 | `EvidenceRecord` | RECORD | Evidence | [`evidence-record.schema.json`](schemas/v1alpha1/evidence-record.schema.json) |
| A8 | `MaterializationRecord` | RECORD | Evidence | [`materialization-record.schema.json`](schemas/v1alpha1/materialization-record.schema.json) |

Primitives partagées : [`common.schema.json`](schemas/v1alpha1/common.schema.json) (identifiant,
révision, digest, référence stable, acteur, provenance, acceptance, enveloppe).

## Document

```json
{
  "apiVersion": "foundation.enistere.com/v1alpha1",
  "kind": "SystemDefinition",
  "metadata": { "id": "asteria", "revision": 2, "title": "…", "status": "ACCEPTED",
                "provenance": { "origin": "HUMAN", "actor": { "type": "HUMAN", "id": "…" } },
                "acceptance": { "decision": "ACCEPTED", "authority": "DECIDE", "actor": { "type": "HUMAN", "id": "…" }, "at": "2026-09-22T10:00:00Z" },
                "supersedes": { "kind": "SystemDefinition", "id": "asteria", "revision": 1, "digest": "sha256:…" } },
  "spec": { "…": "…" }
}
```

- **Référence stable** : `Kind/id@revision[#item]`, épinglée par digest ; pas de « latest ».
- **Digest** : `sha256:` sur la sérialisation RFC 8785 du contenu (document sans `metadata.status`).
- **Autorité** : DECIDE par un humain (ou le système sous Approval Policy) ; A3 recalculé par le
  compilateur ; A7 produit par un checker ou un relecteur humain ; A8 produit par le compilateur (COMPILE_APPLY) ;
  jamais par une IA.
- **Version** : `apiVersion` unique lisible ; toute autre version passe par une migration enregistrée ou
  est UNSUPPORTED.

## API

```ts
import { validateContract, validateContractSet, contractDigest, pinnedRef, deriveEffectiveRules,
  verifyChangeBase, applyChanges, evidenceStaleness, formatDiagnostics } from '@enistere/foundation-kernel-contracts';

const one = validateContract(document);          // { document, ref, digest, migrated, diagnostics, valid }
const set = validateContractSet(documents);      // ensemble fermé : références, digests, traçabilité
console.log(formatDiagnostics(set.diagnostics)); // [error] REF_DIGEST_MISMATCH SystemDefinition/asteria@2 /spec/inputs/decisionSet/digest: …
```

Chaque diagnostic porte un code stable, la classe d'échec du document 03 §6.18, une sévérité, la couche
`kernel.contracts`, la référence et le JSON Pointer concernés, une remédiation et `retryable`.

## Tests

```sh
npm run typecheck   # tsc --noEmit (TypeScript à syntaxe effaçable, exécuté nativement par Node ≥ 22.18)
npm test            # node --test test/*.test.ts
```

Le golden [`goldens/asteria`](../../goldens/asteria/README.md) sert de fixture valide ; les tests négatifs
en mutent des copies.
