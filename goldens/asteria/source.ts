/**
 * Asteria golden — authoring source of the authoritative and derived contracts.
 *
 * Asteria is a synthetic multi-application system (document 01 §6.1, document 02
 * §6.1): a public Requester Web portal, an Internal Ops Web back-office, a Field
 * Mobile application, an Authority API and an Async Worker. The Async Worker is
 * the mandatory extensibility probe: the system is not reducible to Web/API
 * applications.
 *
 * This module only builds documents. Digests are never typed by hand: every
 * pinned reference is computed from the document it points to. Evidence is not
 * authored here — it is produced by the checker in `harness.ts`.
 *
 * Every person, organization and address is fictitious (`.example`, RFC 2606).
 */

import { readFileSync } from 'node:fs';
import {
  CURRENT_API_VERSION,
  DERIVATION,
  deriveEffectiveRules,
  fileDigest,
  pinnedRef,
  type Actor,
  type AnyContract,
  type ChangeRequest,
  type Component,
  type ContextLayer,
  type ContextWaiver,
  type ContractRef,
  type DecisionSet,
  type Digest,
  type DomainContract,
  type EffectiveOrganizationContext,
  type RequirementBaseline,
  type SystemDefinition,
} from '../../kernel/contracts/src/index.ts';

export const SYSTEM = 'asteria';
export const DOMAIN = 'asteria-service-requests';
export const BRIEF_URL = new URL('./sources/brief.md', import.meta.url);

export const ACTORS = Object.freeze({
  productOwner: { type: 'HUMAN', id: 'product-owner@asteria.example', role: 'product-owner' },
  architect: { type: 'HUMAN', id: 'architect@asteria.example', role: 'architect' },
  platformAdmin: { type: 'HUMAN', id: 'platform-admin@operator.example', role: 'platform-admin' },
  intakeAssistant: { type: 'AI_AGENT', id: 'foundation-intake-assistant', role: 'analyst-assistant' },
  compiler: { type: 'COMPILER', id: 'foundation-kernel-contracts' },
} satisfies Record<string, Actor>);

const KERNEL_TOOL = { name: '@enistere/foundation-kernel-contracts', version: '0.1.0' };

export function briefDigest(): Digest {
  return fileDigest(readFileSync(BRIEF_URL));
}

const item = (document: AnyContract, id: string): ContractRef => pinnedRef(document, id);
const op = (id: string): string => `${DOMAIN}#${id}`;

// ── A1 Requirement Baseline ────────────────────────────────────────────────
export function requirementBaseline(): RequirementBaseline {
  const brief = (locator: string) => [{ source: 'SRC-BRIEF', locator }];
  const criterion = (id: string, statement: string) => [{ id, statement }];
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'RequirementBaseline',
    metadata: {
      id: 'asteria-requirements',
      revision: 1,
      title: 'Asteria — accepted requirement baseline',
      status: 'ACCEPTED',
      owner: { team: 'asteria-product' },
      provenance: {
        origin: 'AI_PROPOSAL',
        actor: ACTORS.intakeAssistant,
        tool: { name: 'foundation-intake-assistant', version: '0.0.0-synthetic' },
        sources: [{ id: 'SRC-BRIEF', type: 'BRIEF', uri: 'goldens/asteria/sources/brief.md', digest: briefDigest(), title: 'Asteria — brief client (synthétique)' }],
        confidence: 0.82,
      },
      acceptance: {
        decision: 'ACCEPTED',
        authority: 'DECIDE',
        actor: ACTORS.productOwner,
        at: '2026-09-15T09:00:00Z',
        rationale: 'Extracted candidates reviewed one by one; ambiguity AMB-001 resolved in workshop, AMB-002 deferred.',
      },
    },
    spec: {
      system: SYSTEM,
      sources: [{ id: 'SRC-BRIEF', type: 'BRIEF', uri: 'goldens/asteria/sources/brief.md', digest: briefDigest(), title: 'Asteria — brief client (synthétique)' }],
      goals: [
        { id: 'G-1', statement: 'Requesters submit and follow service requests without phone calls.' },
        { id: 'G-2', statement: 'Operations triage and dispatch every request within its service level.' },
        { id: 'G-3', statement: 'Field agents execute interventions even without connectivity.' },
      ],
      actors: [
        { id: 'requester', name: 'Requester', description: 'Member of the public who reports an issue.' },
        { id: 'ops-agent', name: 'Operations agent', description: 'Qualifies, prioritizes and assigns requests.' },
        { id: 'field-agent', name: 'Field agent', description: 'Executes interventions on site.' },
        { id: 'supervisor', name: 'Supervisor', description: 'Receives escalations of overdue requests.' },
      ],
      requirements: [
        {
          id: 'FR-001', type: 'FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED', goals: ['G-1'], actors: ['requester'],
          statement: 'A requester submits a geolocated service request with a category, a description and photos.',
          sourceRefs: brief('besoin-exprime-1'),
          acceptanceCriteria: criterion('AC-001-1', 'A submitted request is stored with status SUBMITTED, its location and its attachments.'),
        },
        {
          id: 'FR-002', type: 'FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED', goals: ['G-1'], actors: ['requester'],
          statement: 'A requester follows the status of their own requests.',
          sourceRefs: brief('besoin-exprime-1'),
          acceptanceCriteria: criterion('AC-002-1', 'The requester lists their requests with their current status and nothing else.'),
        },
        {
          id: 'FR-003', type: 'FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED', goals: ['G-2'], actors: ['ops-agent'],
          statement: 'An operations agent triages, prioritizes and assigns requests to field agents.',
          sourceRefs: brief('besoin-exprime-2'),
          acceptanceCriteria: criterion('AC-003-1', 'A triaged request carries a priority; an assigned request names one field agent and a due date.'),
        },
        {
          id: 'FR-004', type: 'FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED', goals: ['G-3'], actors: ['field-agent'], dependsOn: ['FR-003'],
          statement: 'A field agent receives assignments and records an intervention report with photos, including while offline.',
          sourceRefs: brief('besoin-exprime-3'),
          acceptanceCriteria: criterion('AC-004-1', 'A report recorded offline is synchronized once, without duplicate, after reconnection.'),
        },
        {
          id: 'FR-005', type: 'FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED', goals: ['G-1'], actors: ['requester'],
          statement: 'A requester is notified by e-mail of every status change of their requests.',
          sourceRefs: brief('besoin-exprime-4'),
          acceptanceCriteria: criterion('AC-005-1', 'Each status change produces exactly one notification to the requester.'),
        },
        {
          id: 'FR-006', type: 'FUNCTIONAL', priority: 'SHOULD', status: 'ACCEPTED', goals: ['G-2'], actors: ['supervisor'], dependsOn: ['FR-003'],
          statement: 'A request that exceeds its service level is escalated automatically to a supervisor.',
          sourceRefs: brief('besoin-exprime-5'),
          acceptanceCriteria: criterion('AC-006-1', 'An overdue request is escalated once and the supervisor is identified.'),
        },
        {
          id: 'FR-007', type: 'FUNCTIONAL', priority: 'COULD', status: 'DEFERRED', goals: ['G-1'],
          statement: 'A public anonymized map shows open requests.',
          sourceRefs: brief('hors-besoin-immediat'),
        },
        {
          id: 'NFR-001', type: 'NON_FUNCTIONAL', priority: 'MUST', status: 'ACCEPTED',
          statement: 'Long-running processing (notifications, escalations, attachment analysis) is asynchronous and never blocks a request to the API.',
          sourceRefs: brief('besoin-exprime-7'),
        },
        {
          id: 'SEC-001', type: 'SECURITY', priority: 'MUST', status: 'ACCEPTED', actors: ['requester', 'field-agent'],
          statement: 'Requesters only see their own requests; field agents only see their own assignments.',
          sourceRefs: brief('besoin-exprime-1'),
        },
        {
          id: 'SEC-002', type: 'SECURITY', priority: 'MUST', status: 'ACCEPTED',
          statement: 'An uploaded attachment is analysed for malware before it becomes visible to anyone.',
          sourceRefs: brief('besoin-exprime-6'),
        },
        {
          id: 'UX-001', type: 'UX_ACCESSIBILITY', priority: 'MUST', status: 'ACCEPTED', actors: ['requester'],
          statement: 'The public requester portal meets WCAG 2.2 level AA.',
          sourceRefs: brief('besoin-exprime-8'),
        },
        {
          id: 'CON-001', type: 'CONSTRAINT', priority: 'MUST', status: 'ACCEPTED',
          statement: 'Authentication uses the shared Enistere OIDC provider with a dedicated realm for the project.',
          sourceRefs: brief('besoin-exprime-9'),
        },
      ],
      ambiguities: [
        {
          id: 'AMB-001', impact: 'HIGH', status: 'RESOLVED', relatedRequirements: ['FR-004'],
          question: 'How long must a field agent be able to work offline?',
          resolution: 'One shift (at most 12 hours); synchronization at reconnection.',
        },
        {
          id: 'AMB-002', impact: 'DEFERRABLE', status: 'DEFERRED', relatedRequirements: ['FR-005'],
          question: 'Which notification channels are needed besides e-mail?',
        },
      ],
    },
  };
}

// ── A2 Decision Set ───────────────────────────────────────────────────────
export function decisionSet(baseline: RequirementBaseline): DecisionSet {
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'DecisionSet',
    metadata: {
      id: 'asteria-decisions',
      revision: 1,
      title: 'Asteria — architecture decisions',
      status: 'ACCEPTED',
      owner: { team: 'asteria-architecture' },
      provenance: { origin: 'HUMAN', actor: ACTORS.architect, derivedFrom: [pinnedRef(baseline)] },
      acceptance: { decision: 'ACCEPTED', authority: 'DECIDE', actor: ACTORS.architect, at: '2026-09-16T10:00:00Z' },
    },
    spec: {
      system: SYSTEM,
      requirementBaseline: pinnedRef(baseline),
      decisions: [
        {
          id: 'AD-001', title: 'One Authority API as modular system of record', category: 'ARCHITECTURE', status: 'ACCEPTED',
          context: 'Three client applications and one worker share one business context and one data model.',
          drivers: ['FR-001', 'FR-002', 'FR-003', 'FR-004', 'SEC-001'],
          options: [
            { id: 'OPT-MODULAR-API', summary: 'Single modular API owning the data, consumed by every client.', satisfies: ['FR-001', 'FR-002', 'FR-003', 'FR-004', 'SEC-001'], operationalComplexity: 'LOW' },
            { id: 'OPT-SERVICES', summary: 'One service per client application with a shared database.', tradeoffs: ['Duplicated authorization rules', 'Shared database coupling'], operationalComplexity: 'HIGH' },
          ],
          chosenOption: 'OPT-MODULAR-API',
          rationale: 'One authority keeps authorization and state transitions in one place; nothing measured justifies distribution.',
          consequences: ['Every client goes through the API; no client reads the database.'],
        },
        {
          id: 'AD-002', title: 'Dedicated Async Worker fed by domain events', category: 'OPERATIONS', status: 'ACCEPTED',
          context: 'Notifications, escalations and attachment analysis are slow or scheduled and must not block the API.',
          drivers: ['NFR-001', 'FR-005', 'FR-006', 'SEC-002'],
          options: [
            { id: 'OPT-WORKER', summary: 'Separate worker process consuming domain events published through a transactional outbox.', satisfies: ['NFR-001', 'FR-005', 'FR-006', 'SEC-002'], operationalComplexity: 'MEDIUM' },
            { id: 'OPT-IN-PROCESS', summary: 'Background jobs inside the API process.', tradeoffs: ['Slow jobs compete with requests', 'Scaling the API scales the jobs'], risks: ['NFR-001 violated under load'], operationalComplexity: 'LOW' },
          ],
          chosenOption: 'OPT-WORKER',
          rationale: 'Isolates slow and scheduled work from the request path and lets it scale independently.',
          consequences: ['The worker is a first-class component with its own deployment unit.', 'The API publishes events through an outbox, never directly to the worker.'],
        },
        {
          id: 'AD-003', title: 'Two distinct Web applications', category: 'ARCHITECTURE', status: 'ACCEPTED',
          context: 'The public portal and the internal back-office have different audiences, exposure and accessibility obligations.',
          drivers: ['UX-001', 'SEC-001', 'FR-003'],
          options: [
            { id: 'OPT-TWO-APPS', summary: 'A public Requester Web and an internal Ops Web.', satisfies: ['UX-001', 'SEC-001', 'FR-003'] },
            { id: 'OPT-ONE-APP', summary: 'One Web application with role-based areas.', risks: ['Internal screens reachable from the public surface'] },
          ],
          chosenOption: 'OPT-TWO-APPS',
          rationale: 'Separate exposure surfaces reduce the attack surface of the back-office and let each app follow its own design context.',
        },
        {
          id: 'AD-004', title: 'Offline-first Field Mobile with idempotent synchronization', category: 'DATA', status: 'ACCEPTED',
          context: 'Field agents lose connectivity during their shift (AMB-001: up to 12 hours).',
          drivers: ['FR-004'],
          options: [
            { id: 'OPT-OFFLINE-SYNC', summary: 'Local store on the device and idempotent replay to the API at reconnection.', satisfies: ['FR-004'] },
            { id: 'OPT-ONLINE-ONLY', summary: 'Online-only mobile application.', risks: ['FR-004 not satisfied'] },
          ],
          chosenOption: 'OPT-OFFLINE-SYNC',
          rationale: 'Only option that satisfies FR-004 within the resolved offline window.',
        },
        {
          id: 'AD-005', title: 'Shared Enistere OIDC provider, realm asteria', category: 'SECURITY', status: 'ACCEPTED',
          context: 'The Enistere production policy provides a shared Keycloak with one realm per project.',
          drivers: ['CON-001', 'SEC-001'],
          options: [
            { id: 'OPT-SHARED-REALM', summary: 'Dedicated realm on the shared Enistere identity provider.', satisfies: ['CON-001', 'SEC-001'] },
            { id: 'OPT-OWN-IDP', summary: 'Project-specific identity provider.', risks: ['Exception to the production policy requires an ADR'] },
          ],
          chosenOption: 'OPT-SHARED-REALM',
          rationale: 'Complies with the production policy without exception.',
        },
      ],
    },
  };
}

// ── A3 Effective Organization Context (derived by the kernel) ──────────────
export function organizationContext(): EffectiveOrganizationContext {
  const layers: ContextLayer[] = [
    {
      id: 'L-ORGANIZATION', scope: 'ORGANIZATION', precedence: 0,
      source: { type: 'EntityProfile', id: 'operator-organization', version: '1.0.0' },
      rules: [
        { id: 'runtime.api.allowed', category: 'RUNTIME', value: ['nestjs', 'spring', 'fastapi'] },
        { id: 'runtime.web.allowed', category: 'RUNTIME', value: ['nextjs', 'angular'] },
        { id: 'runtime.mobile.allowed', category: 'RUNTIME', value: ['react-native', 'flutter'] },
        { id: 'security.identity.provider', category: 'SECURITY', value: 'enistere-shared-oidc', locked: true, rationale: 'Production policy: shared Keycloak, one realm per project.' },
        { id: 'deployment.image.reference', category: 'DEPLOYMENT', value: 'digest', locked: true, rationale: 'Production policy: images are deployed by immutable digest, never latest.' },
        { id: 'ai.decide.allowed', category: 'AI', value: false, locked: true, rationale: 'AI proposes; humans decide.' },
        { id: 'quality.accessibility.level', category: 'QUALITY', value: 'WCAG-2.2-A' },
        { id: 'evidence.retention.days', category: 'EVIDENCE', value: 365 },
        { id: 'data.residency', category: 'DATA', value: 'eu' },
      ],
    },
    {
      id: 'L-CLIENT', scope: 'CLIENT', precedence: 10,
      source: { type: 'EntityProfile', id: 'asteria-operator', version: '3.0.0' },
      rules: [
        { id: 'security.identity.provider', category: 'SECURITY', value: 'client-directory', rationale: 'Client asked to reuse its own directory.' },
        { id: 'quality.accessibility.level', category: 'QUALITY', value: 'WCAG-2.2-AA' },
        { id: 'data.residency', category: 'DATA', value: 'eu-west' },
      ],
    },
    {
      id: 'L-SYSTEM', scope: 'SYSTEM', precedence: 20,
      source: { type: 'PolicyPack', id: 'asteria-system-policies', version: '1.0.0' },
      rules: [
        { id: 'evidence.retention.days', category: 'EVIDENCE', value: 730 },
        { id: 'runtime.web.allowed', category: 'RUNTIME', value: ['nextjs', 'angular'] },
      ],
    },
  ];
  const waivers: ContextWaiver[] = [
    {
      id: 'W-001', rule: 'data.residency', value: ['eu-west', 'eu-central'],
      reason: 'Object storage replica in eu-central during the hosting migration window.',
      approvedBy: ACTORS.platformAdmin, expiresAt: '2027-03-31T23:59:59Z',
    },
  ];
  const derived = deriveEffectiveRules(layers, waivers);
  if (derived.diagnostics.length > 0) throw new Error(`Asteria context does not derive: ${JSON.stringify(derived.diagnostics)}`);
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'EffectiveOrganizationContext',
    metadata: {
      id: 'asteria-context',
      revision: 1,
      title: 'Asteria — effective organization context',
      status: 'CURRENT',
      provenance: { origin: 'COMPILER', actor: ACTORS.compiler, tool: KERNEL_TOOL },
    },
    spec: { system: SYSTEM, derivation: { ...DERIVATION }, layers, waivers, effective: structuredClone(derived.effective) as EffectiveOrganizationContext['spec']['effective'] },
  };
}

// ── A5 Domain Contract ────────────────────────────────────────────────────
export function domainContract(baseline: RequirementBaseline): DomainContract {
  const field = (name: string, type: string, required = true, sensitive?: boolean) =>
    sensitive === undefined ? { name, type, required } : { name, type, required, sensitive };
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'DomainContract',
    metadata: {
      id: DOMAIN,
      revision: 1,
      title: 'Asteria — service requests domain contract',
      status: 'ACCEPTED',
      owner: { team: 'asteria-product' },
      provenance: { origin: 'HUMAN', actor: ACTORS.architect, derivedFrom: [pinnedRef(baseline)] },
      acceptance: { decision: 'ACCEPTED', authority: 'DECIDE', actor: ACTORS.productOwner, at: '2026-09-16T14:00:00Z' },
    },
    spec: {
      system: SYSTEM,
      boundedContext: 'service-requests',
      requirementBaseline: pinnedRef(baseline),
      types: [
        {
          id: 'ServiceRequest', kind: 'ENTITY', fields: [
            field('id', 'uuid'), field('reference', 'string'), field('requesterId', 'uuid'), field('category', 'RequestCategory'),
            field('description', 'text'), field('location', 'GeoLocation'), field('status', 'RequestStatus'), field('priority', 'Priority', false),
            field('createdAt', 'datetime'), field('attachments', 'list<Attachment>'),
          ],
        },
        { id: 'GeoLocation', kind: 'VALUE', fields: [field('latitude', 'decimal'), field('longitude', 'decimal'), field('address', 'string', false, true)] },
        { id: 'Attachment', kind: 'VALUE', fields: [field('id', 'uuid'), field('file', 'file-ref'), field('mediaType', 'string'), field('scanStatus', 'ScanStatus')] },
        { id: 'Assignment', kind: 'ENTITY', fields: [field('id', 'uuid'), field('requestId', 'uuid'), field('fieldAgentId', 'uuid'), field('dueAt', 'datetime')] },
        {
          id: 'InterventionReport', kind: 'ENTITY', fields: [
            field('id', 'uuid'), field('assignmentId', 'uuid'), field('outcome', 'InterventionOutcome'), field('notes', 'text'),
            field('photos', 'list<Attachment>'), field('recordedAt', 'datetime'),
          ],
        },
        { id: 'RequestStatus', kind: 'ENUM', values: ['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'] },
        { id: 'Priority', kind: 'ENUM', values: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        { id: 'RequestCategory', kind: 'ENUM', values: ['LIGHTING', 'ROADWORKS', 'WASTE', 'WATER', 'OTHER'] },
        { id: 'ScanStatus', kind: 'ENUM', values: ['PENDING', 'CLEAN', 'INFECTED'] },
        { id: 'InterventionOutcome', kind: 'ENUM', values: ['RESOLVED', 'PARTIALLY_RESOLVED', 'NOT_RESOLVABLE'] },
        { id: 'SubmitRequestInput', kind: 'VALUE', fields: [field('category', 'RequestCategory'), field('description', 'text'), field('location', 'GeoLocation'), field('attachmentIds', 'list<uuid>')] },
        { id: 'UploadAttachmentInput', kind: 'VALUE', fields: [field('file', 'file-ref'), field('mediaType', 'string')] },
        { id: 'TriageInput', kind: 'VALUE', fields: [field('requestId', 'uuid'), field('priority', 'Priority'), field('category', 'RequestCategory')] },
        { id: 'AssignInput', kind: 'VALUE', fields: [field('requestId', 'uuid'), field('fieldAgentId', 'uuid'), field('dueAt', 'datetime')] },
        { id: 'InterventionInput', kind: 'VALUE', fields: [field('assignmentId', 'uuid'), field('outcome', 'InterventionOutcome'), field('notes', 'text'), field('photoIds', 'list<uuid>'), field('clientReportId', 'uuid')] },
        { id: 'ScanResultInput', kind: 'VALUE', fields: [field('attachmentId', 'uuid'), field('scanStatus', 'ScanStatus')] },
        { id: 'EscalationInput', kind: 'VALUE', fields: [field('requestId', 'uuid'), field('dueAt', 'datetime')] },
        { id: 'RequestStatusChange', kind: 'VALUE', fields: [field('requestId', 'uuid'), field('from', 'RequestStatus'), field('to', 'RequestStatus'), field('at', 'datetime')] },
        { id: 'AttachmentReference', kind: 'VALUE', fields: [field('attachmentId', 'uuid')] },
        { id: 'AttachmentScan', kind: 'VALUE', fields: [field('attachmentId', 'uuid'), field('scanStatus', 'ScanStatus')] },
        { id: 'Escalation', kind: 'VALUE', fields: [field('requestId', 'uuid'), field('supervisorId', 'uuid'), field('at', 'datetime')] },
      ],
      operations: [
        {
          id: 'upload-attachment', kind: 'COMMAND', summary: 'Upload a photo or document; it stays PENDING until analysed.',
          input: 'UploadAttachmentInput', output: 'Attachment', errors: ['UNSUPPORTED_MEDIA_TYPE', 'FILE_TOO_LARGE'],
          authorization: { intent: 'An authenticated requester or field agent uploads on their own behalf.', roles: ['requester', 'field-agent'] },
          emits: ['AttachmentUploaded'], invariants: ['INV-004'],
        },
        {
          id: 'submit-request', kind: 'COMMAND', summary: 'Create a service request.',
          input: 'SubmitRequestInput', output: 'ServiceRequest', errors: ['OUTSIDE_TERRITORY', 'ATTACHMENT_NOT_OWNED'],
          authorization: { intent: 'An authenticated requester creates a request on their own behalf.', roles: ['requester'] },
          emits: ['RequestStatusChanged'], invariants: ['INV-001', 'INV-002'], idempotent: true,
        },
        {
          id: 'list-my-requests', kind: 'QUERY', summary: 'List the requests of the calling requester.',
          output: 'list<ServiceRequest>', authorization: { intent: 'A requester only reads their own requests.', roles: ['requester'] },
        },
        {
          id: 'list-requests', kind: 'QUERY', summary: 'List and filter all requests.',
          output: 'list<ServiceRequest>', authorization: { intent: 'Operations staff read every request.', roles: ['ops-agent', 'supervisor'] },
        },
        {
          id: 'triage-request', kind: 'COMMAND', summary: 'Qualify and prioritize a request.',
          input: 'TriageInput', output: 'ServiceRequest', errors: ['INVALID_TRANSITION'],
          authorization: { intent: 'An operations agent triages requests.', roles: ['ops-agent'] },
          emits: ['RequestStatusChanged'], invariants: ['INV-002'],
        },
        {
          id: 'assign-request', kind: 'COMMAND', summary: 'Assign a triaged request to a field agent.',
          input: 'AssignInput', output: 'Assignment', errors: ['INVALID_TRANSITION', 'AGENT_UNAVAILABLE'],
          authorization: { intent: 'An operations agent assigns requests.', roles: ['ops-agent'] },
          emits: ['RequestStatusChanged'], invariants: ['INV-002', 'INV-003'],
        },
        {
          id: 'list-assignments', kind: 'QUERY', summary: 'List the assignments of the calling field agent.',
          output: 'list<Assignment>', authorization: { intent: 'A field agent only reads their own assignments.', roles: ['field-agent'] },
        },
        {
          id: 'record-intervention', kind: 'COMMAND', summary: 'Record the report of an intervention (replayable after offline work).',
          input: 'InterventionInput', output: 'InterventionReport', errors: ['INVALID_TRANSITION', 'ASSIGNMENT_NOT_OWNED'],
          authorization: { intent: 'The assigned field agent reports on their own assignment.', roles: ['field-agent'] },
          emits: ['RequestStatusChanged'], invariants: ['INV-002'], idempotent: true,
        },
        {
          id: 'record-scan-result', kind: 'COMMAND', summary: 'Record the malware analysis result of an attachment.',
          input: 'ScanResultInput', output: 'Attachment',
          authorization: { intent: 'Only the platform worker identity records analysis results.', roles: ['asteria-worker'] },
          emits: ['AttachmentScanned'], invariants: ['INV-004'], idempotent: true,
        },
        {
          id: 'escalate-request', kind: 'COMMAND', summary: 'Escalate an overdue request to a supervisor.',
          input: 'EscalationInput', output: 'ServiceRequest', errors: ['NOT_OVERDUE'],
          authorization: { intent: 'Only the platform worker identity escalates, on schedule.', roles: ['asteria-worker'] },
          emits: ['RequestEscalated'], idempotent: true,
        },
      ],
      invariants: [
        { id: 'INV-001', statement: 'A request is located inside the served territory.', appliesTo: ['ServiceRequest'], enforcement: 'OWNER_WORK' },
        { id: 'INV-002', statement: 'Status transitions follow SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED; REJECTED only from SUBMITTED or TRIAGED.', appliesTo: ['ServiceRequest'], enforcement: 'DETERMINISTIC' },
        { id: 'INV-003', statement: 'An assignment targets exactly one active field agent and one request that is TRIAGED or ASSIGNED.', appliesTo: ['Assignment'], enforcement: 'OWNER_WORK' },
        { id: 'INV-004', statement: 'An attachment is never exposed before its scan status is CLEAN.', appliesTo: ['Attachment'], enforcement: 'DETERMINISTIC' },
      ],
      events: [
        { id: 'RequestStatusChanged', version: 1, payload: 'RequestStatusChange', description: 'Published through the transactional outbox on every status transition.' },
        { id: 'AttachmentUploaded', version: 1, payload: 'AttachmentReference' },
        { id: 'AttachmentScanned', version: 1, payload: 'AttachmentScan' },
        { id: 'RequestEscalated', version: 1, payload: 'Escalation' },
      ],
      acceptance: [
        { id: 'ACC-001', scenario: 'A requester uploads a photo, submits a geolocated request and sees it SUBMITTED.', operations: ['upload-attachment', 'submit-request', 'list-my-requests'], requirements: ['FR-001', 'FR-002'] },
        { id: 'ACC-002', scenario: 'An operations agent triages and assigns a request; the field agent sees the assignment.', operations: ['triage-request', 'assign-request', 'list-assignments'], requirements: ['FR-003', 'FR-004'] },
        { id: 'ACC-003', scenario: 'A report recorded offline is replayed twice after reconnection and stored once.', operations: ['record-intervention'], requirements: ['FR-004'] },
        { id: 'ACC-004', scenario: 'An infected attachment is never exposed to any role.', operations: ['upload-attachment', 'record-scan-result'], requirements: ['SEC-002'] },
        { id: 'ACC-005', scenario: 'An overdue request is escalated once to a supervisor.', operations: ['escalate-request'], requirements: ['FR-006'] },
        { id: 'ACC-006', scenario: 'Each status transition produces exactly one requester notification.', operations: ['triage-request', 'assign-request', 'record-intervention'], requirements: ['FR-005'] },
      ],
      facets: [
        { id: 'offline-sync', version: '1', appliesTo: ['record-intervention', 'list-assignments'], configuration: { maxOfflineHours: 12, conflictPolicy: 'server-wins-with-owner-review' } },
        { id: 'scheduling', version: '1', appliesTo: ['escalate-request'], configuration: { interval: 'PT5M' } },
        { id: 'workflow', version: '1', appliesTo: ['ServiceRequest'], configuration: { stateField: 'status', invariant: 'INV-002' } },
      ],
    },
  };
}

// ── A4 System Definition (revisions 1 and 2) ──────────────────────────────
const ENVIRONMENTS = ['local', 'ci', 'staging', 'production'];

function components(revision: 1 | 2): Component[] {
  const workerScans = revision === 2;
  const apiResponsibilities = [
    'Single system of record of service requests, assignments and reports.',
    'Enforces authorization intents and status transitions.',
    'Publishes domain events through a transactional outbox.',
  ];
  if (!workerScans) apiResponsibilities.push('Analyses uploaded attachments synchronously before exposing them.');
  const workerResponsibilities = [
    'Notifies requesters of every status change.',
    'Escalates overdue requests on schedule.',
  ];
  if (workerScans) workerResponsibilities.push('Analyses uploaded attachments for malware and records the result.');

  const worker: Component = {
    id: 'async-worker', name: 'Async Worker', kind: 'async-worker', audience: 'SYSTEM',
    responsibilities: workerResponsibilities,
    requirements: workerScans ? ['FR-005', 'FR-006', 'NFR-001', 'SEC-002'] : ['FR-005', 'FR-006', 'NFR-001'],
    decisions: ['AD-002'],
    subscribes: workerScans ? [op('RequestStatusChanged'), op('AttachmentUploaded')] : [op('RequestStatusChanged')],
    consumes: [
      { component: 'authority-api', interaction: 'SYNC_REQUEST', operations: workerScans ? [op('escalate-request'), op('record-scan-result')] : [op('escalate-request')] },
      { component: 'authority-api', interaction: 'EVENT_STREAM' },
    ],
    platformCapabilities: [{ id: 'notifications' }],
    integrations: workerScans ? ['smtp-relay', 'malware-scanner'] : ['smtp-relay'],
    runtime: { preferences: ['nestjs'], constraints: ['Horizontal scaling independent from the API.'] },
    ownership: { class: 'OWNER_MANAGED', team: 'asteria-backend' },
    environments: ENVIRONMENTS,
  };
  if (workerScans) worker.data = [{ store: 'asteria-objects', access: 'READ' }];

  return [
    {
      id: 'requester-web', name: 'Requester Web', kind: 'web-application', audience: 'PUBLIC',
      responsibilities: ['Lets requesters submit geolocated requests with photos.', 'Lets requesters follow their own requests.'],
      requirements: ['FR-001', 'FR-002', 'UX-001'], decisions: ['AD-003'],
      consumes: [{ component: 'authority-api', interaction: 'SYNC_REQUEST', operations: [op('upload-attachment'), op('submit-request'), op('list-my-requests')] }],
      platformCapabilities: [{ id: 'authentication' }, { id: 'files' }],
      runtime: { preferences: ['nextjs'] },
      experience: { designContext: 'public-portal', designSystem: { type: 'DesignSystem', id: 'operator-design-system', version: '1.0.0' }, accessibilityProfile: 'wcag-2-2-aa' },
      ownership: { class: 'SHARED_CONTROLLED', team: 'asteria-web' },
      environments: ENVIRONMENTS,
    },
    {
      id: 'ops-web', name: 'Internal Ops Web', kind: 'web-application', audience: 'INTERNAL',
      responsibilities: ['Lets operations agents triage, prioritize and assign requests.'],
      requirements: ['FR-003'], decisions: ['AD-003'],
      consumes: [{ component: 'authority-api', interaction: 'SYNC_REQUEST', operations: [op('list-requests'), op('triage-request'), op('assign-request')] }],
      platformCapabilities: [{ id: 'authentication' }, { id: 'authorization' }],
      runtime: { preferences: ['angular'] },
      experience: { designContext: 'back-office', designSystem: { type: 'DesignSystem', id: 'operator-design-system', version: '1.0.0' } },
      ownership: { class: 'SHARED_CONTROLLED', team: 'asteria-web' },
      environments: ENVIRONMENTS,
    },
    {
      id: 'field-mobile', name: 'Field Mobile', kind: 'mobile-application', audience: 'FIELD',
      responsibilities: ['Shows assignments to field agents, online or offline.', 'Records intervention reports with photos and replays them at reconnection.'],
      requirements: ['FR-004'], decisions: ['AD-004'],
      consumes: [{ component: 'authority-api', interaction: 'SYNC_REQUEST', operations: [op('list-assignments'), op('record-intervention'), op('upload-attachment')] }],
      platformCapabilities: [{ id: 'authentication' }, { id: 'files' }],
      runtime: { preferences: ['flutter'] },
      experience: { designContext: 'field', designSystem: { type: 'DesignSystem', id: 'operator-design-system', version: '1.0.0' }, offline: true },
      ownership: { class: 'SHARED_CONTROLLED', team: 'asteria-mobile' },
      environments: ENVIRONMENTS,
    },
    {
      id: 'authority-api', name: 'Authority API', kind: 'api-service', audience: 'SYSTEM',
      responsibilities: apiResponsibilities,
      requirements: ['FR-001', 'FR-002', 'FR-003', 'FR-004', 'SEC-001', 'SEC-002', 'CON-001'],
      decisions: ['AD-001', 'AD-005'],
      implements: [
        'upload-attachment', 'submit-request', 'list-my-requests', 'list-requests', 'triage-request',
        'assign-request', 'list-assignments', 'record-intervention', 'record-scan-result', 'escalate-request',
      ].map(op),
      data: [{ store: 'asteria-db', access: 'OWNER' }, { store: 'asteria-objects', access: 'OWNER' }],
      platformCapabilities: [{ id: 'authentication' }, { id: 'authorization' }, { id: 'files' }],
      integrations: workerScans ? ['enistere-oidc'] : ['enistere-oidc', 'malware-scanner'],
      runtime: { preferences: ['nestjs'] },
      ownership: { class: 'SHARED_CONTROLLED', team: 'asteria-backend' },
      environments: ENVIRONMENTS,
    },
    worker,
    {
      id: 'asteria-db', name: 'Asteria transactional store', kind: 'datastore',
      responsibilities: ['Transactional storage of requests, assignments, reports and the outbox.'],
      runtime: { preferences: ['postgresql'] },
      ownership: { class: 'EXTERNAL', team: 'enistere-platform' },
      environments: ENVIRONMENTS,
    },
    {
      id: 'asteria-objects', name: 'Asteria attachment store', kind: 'object-store',
      responsibilities: ['Stores attachments; never exposed before analysis.'],
      runtime: { preferences: ['s3-compatible'] },
      ownership: { class: 'EXTERNAL', team: 'enistere-platform' },
      environments: ENVIRONMENTS,
    },
  ];
}

export function systemDefinition(
  revision: 1 | 2,
  status: 'ACCEPTED' | 'SUPERSEDED',
  inputs: { baseline: RequirementBaseline; decisions: DecisionSet; context: EffectiveOrganizationContext; domain: DomainContract },
  previous?: SystemDefinition,
): SystemDefinition {
  const document: SystemDefinition = {
    apiVersion: CURRENT_API_VERSION,
    kind: 'SystemDefinition',
    metadata: {
      id: SYSTEM,
      revision,
      title: 'Asteria — system definition',
      status,
      owner: { team: 'asteria-architecture' },
      provenance: {
        origin: 'HUMAN',
        actor: ACTORS.architect,
        derivedFrom: [pinnedRef(inputs.baseline), pinnedRef(inputs.decisions), pinnedRef(inputs.domain)],
      },
      acceptance: {
        decision: 'ACCEPTED', authority: 'DECIDE', actor: ACTORS.architect,
        at: revision === 1 ? '2026-09-17T09:00:00Z' : '2026-09-22T10:00:00Z',
        ...(revision === 2 ? { rationale: 'Applies change request asteria-cr-001.' } : {}),
      },
    },
    spec: {
      system: SYSTEM,
      purpose: 'Collect, dispatch and resolve field service requests, from the public portal to the intervention report.',
      inputs: {
        requirementBaseline: pinnedRef(inputs.baseline),
        decisionSet: pinnedRef(inputs.decisions),
        organizationContext: pinnedRef(inputs.context),
        domainContracts: [pinnedRef(inputs.domain)],
      },
      components: components(revision),
      integrations: [
        { id: 'enistere-oidc', kind: 'oidc-provider', direction: 'OUTBOUND', purpose: 'Authentication through the shared Enistere identity provider, realm asteria.', provider: 'enistere-shared-keycloak' },
        { id: 'smtp-relay', kind: 'email-delivery', direction: 'OUTBOUND', purpose: 'Requester notifications.' },
        { id: 'malware-scanner', kind: 'malware-analysis', direction: 'OUTBOUND', purpose: 'Analysis of uploaded attachments.' },
      ],
      environments: [
        { id: 'local', kind: 'LOCAL', deploymentMode: 'LOCAL' },
        { id: 'ci', kind: 'CI', deploymentMode: 'LOCAL' },
        { id: 'staging', kind: 'STAGING', deploymentMode: 'SELF_HOSTED' },
        { id: 'production', kind: 'PRODUCTION', deploymentMode: 'SELF_HOSTED' },
      ],
    },
  };
  if (previous) document.metadata.supersedes = pinnedRef(previous);
  return document;
}

// ── A6 Change Requests ────────────────────────────────────────────────────
export function scanningChangeRequest(
  base: SystemDefinition,
  proposed: SystemDefinition,
  baseline: RequirementBaseline,
  decisions: DecisionSet,
  invalidated: ContractRef[],
): ChangeRequest {
  const workerIndex = base.spec.components.findIndex((component) => component.id === 'async-worker');
  const apiIndex = base.spec.components.findIndex((component) => component.id === 'authority-api');
  const worker = `/spec/components/${workerIndex}`;
  const api = `/spec/components/${apiIndex}`;
  const proposedApi = proposed.spec.components[apiIndex] as Component;
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'ChangeRequest',
    metadata: {
      id: 'asteria-cr-001',
      revision: 1,
      title: 'Move attachment analysis from the Authority API to the Async Worker',
      status: 'APPLIED',
      owner: { team: 'asteria-architecture' },
      provenance: { origin: 'HUMAN', actor: ACTORS.architect },
      acceptance: { decision: 'ACCEPTED', authority: 'DECIDE', actor: ACTORS.architect, at: '2026-09-22T09:00:00Z', rationale: 'Synchronous analysis blocks uploads under load (NFR-001).' },
    },
    spec: {
      system: SYSTEM,
      base: pinnedRef(base),
      proposed: pinnedRef(proposed),
      trigger: 'DECISION_CHANGE',
      summary: 'Attachment analysis becomes an asynchronous worker job triggered by AttachmentUploaded; the API keeps INV-004.',
      justifiedBy: [item(baseline, 'NFR-001'), item(baseline, 'SEC-002'), item(decisions, 'AD-002')],
      changes: [
        { op: 'REPLACE', path: `${api}/responsibilities`, value: proposedApi.responsibilities, rationale: 'The API no longer analyses attachments synchronously.' },
        { op: 'REPLACE', path: `${api}/integrations`, value: proposedApi.integrations, rationale: 'The malware scanner is called by the worker only.' },
        { op: 'ADD', path: `${worker}/responsibilities/-`, value: 'Analyses uploaded attachments for malware and records the result.', rationale: 'New worker job.' },
        { op: 'ADD', path: `${worker}/requirements/-`, value: 'SEC-002', rationale: 'The worker now contributes to SEC-002.' },
        { op: 'ADD', path: `${worker}/subscribes/-`, value: op('AttachmentUploaded'), rationale: 'The job is triggered by the upload event.' },
        { op: 'ADD', path: `${worker}/consumes/0/operations/-`, value: op('record-scan-result'), rationale: 'The result goes back through the API, which keeps INV-004.' },
        { op: 'ADD', path: `${worker}/data`, value: [{ store: 'asteria-objects', access: 'READ' }], rationale: 'The worker reads the uploaded object to analyse it.' },
        { op: 'ADD', path: `${worker}/integrations/-`, value: 'malware-scanner', rationale: 'The worker calls the scanner.' },
      ],
      classification: 'REVIEW_REQUIRED',
      impact: {
        components: ['authority-api', 'async-worker'],
        evidenceToInvalidate: invalidated,
        ownerWork: [
          { id: 'OW-001', description: 'Move the scanner call from the upload handler into a worker job.', component: 'async-worker' },
          { id: 'OW-002', description: 'Keep attachments PENDING until record-scan-result stores CLEAN.', component: 'authority-api' },
        ],
      },
    },
  };
}

export function peerSyncChangeRequest(base: SystemDefinition, baseline: RequirementBaseline): ChangeRequest {
  return {
    apiVersion: CURRENT_API_VERSION,
    kind: 'ChangeRequest',
    metadata: {
      id: 'asteria-cr-002',
      revision: 1,
      title: 'Peer-to-peer synchronization between field devices',
      status: 'PROPOSED',
      provenance: { origin: 'AI_PROPOSAL', actor: ACTORS.intakeAssistant, confidence: 0.64 },
    },
    spec: {
      system: SYSTEM,
      base: pinnedRef(base),
      trigger: 'REQUIREMENT_CHANGE',
      summary: 'Field devices exchange assignments directly without the Authority API when no network is available.',
      justifiedBy: [item(baseline, 'FR-004'), item(baseline, 'AMB-001')],
      changes: [
        { op: 'ADD', path: '/spec/components/2/responsibilities/-', value: 'Synchronizes assignments peer-to-peer between nearby devices.', rationale: 'Proposed by the assistant from AMB-001.' },
      ],
      classification: 'UNSUPPORTED',
      impact: { components: ['field-mobile', 'authority-api'], evidenceToInvalidate: [], ownerWork: [] },
    },
  };
}
