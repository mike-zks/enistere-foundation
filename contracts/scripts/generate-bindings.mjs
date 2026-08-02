#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const SCHEMA_RELATIVE = 'contracts/schemas/api-error-response.v1.schema.json';
const SCHEMA_PATH = resolve(REPO_ROOT, SCHEMA_RELATIVE);
const EXPECTED_PROPERTIES = [
  'success',
  'statusCode',
  'errorCode',
  'message',
  'details',
  'path',
  'timestamp',
  'requestId',
];
const EXPECTED_REQUIRED = [
  'success',
  'statusCode',
  'errorCode',
  'message',
  'path',
  'timestamp',
];

function validateSchema(schema) {
  const properties = Object.keys(schema.properties ?? {});
  const required = schema.required ?? [];
  const issues = [];
  if (schema.title !== 'ApiErrorResponse') issues.push('title must be ApiErrorResponse');
  if (schema.type !== 'object') issues.push('type must be object');
  if (schema.additionalProperties !== false) issues.push('additionalProperties must be false');
  if (JSON.stringify(properties) !== JSON.stringify(EXPECTED_PROPERTIES)) {
    issues.push(`properties must be ${EXPECTED_PROPERTIES.join(', ')}`);
  }
  if (JSON.stringify(required) !== JSON.stringify(EXPECTED_REQUIRED)) {
    issues.push(`required must be ${EXPECTED_REQUIRED.join(', ')}`);
  }
  if (schema.properties?.success?.const !== false) issues.push('success must be const false');
  if (schema.properties?.statusCode?.type !== 'integer') issues.push('statusCode must be integer');
  if (schema.properties?.timestamp?.format !== 'date-time') issues.push('timestamp must be date-time');
  if (issues.length > 0) throw new Error(`Invalid neutral contract: ${issues.join('; ')}`);
}

function header(comment, digest) {
  return [
    `${comment} GENERATED FROM ${SCHEMA_RELATIVE}. DO NOT EDIT.`,
    `${comment} schema-sha256: ${digest}`,
    '',
  ].join('\n');
}

function typescript(digest) {
  return `${header('//', digest)}export interface ApiErrorResponse {
  readonly success: false;
  readonly statusCode: number;
  readonly errorCode: string;
  readonly message: string;
  readonly details?: unknown;
  readonly path: string;
  readonly timestamp: string;
  readonly requestId?: string | null;
}
`;
}

function java(digest) {
  return `${header('//', digest)}package com.enistere.core.contracts;

import java.time.Instant;

/** Public, non-sensitive API error envelope shared by every API runtime. */
public record ApiErrorResponse(
    boolean success,
    int statusCode,
    String errorCode,
    String message,
    Object details,
    String path,
    Instant timestamp,
    String requestId
) {
    /** Creates an error response and supplies the two server-owned fields. */
    public static ApiErrorResponse create(
        int statusCode,
        String errorCode,
        String message,
        Object details,
        String path,
        String requestId
    ) {
        return new ApiErrorResponse(
            false, statusCode, errorCode, message, details, path, Instant.now(), requestId
        );
    }
}
`;
}

function python(digest) {
  return `${header('#', digest)}from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal


@dataclass(frozen=True, slots=True)
class ApiErrorResponse:
    """Public, non-sensitive API error envelope shared by every API runtime."""

    success: Literal[False]
    status_code: int
    error_code: str
    message: str
    details: object | None
    path: str
    timestamp: datetime
    request_id: str | None

    @classmethod
    def create(
        cls,
        *,
        status_code: int,
        error_code: str,
        message: str,
        details: object | None,
        path: str,
        request_id: str | None,
    ) -> ApiErrorResponse:
        return cls(
            False,
            status_code,
            error_code,
            message,
            details,
            path,
            datetime.now(UTC),
            request_id,
        )

    def to_dict(self) -> dict[str, object]:
        return {
            "success": self.success,
            "statusCode": self.status_code,
            "errorCode": self.error_code,
            "message": self.message,
            "details": self.details,
            "path": self.path,
            "timestamp": self.timestamp.isoformat(),
            "requestId": self.request_id,
        }
`;
}

function dart(digest) {
  return `${header('//', digest)}final class ApiErrorResponse {
  const ApiErrorResponse({
    required this.success,
    required this.statusCode,
    required this.errorCode,
    required this.message,
    required this.details,
    required this.path,
    required this.timestamp,
    required this.requestId,
  });

  static ApiErrorResponse? tryParse(Object? value) {
    if (value case {
      'success': false,
      'statusCode': final int statusCode,
      'errorCode': final String errorCode,
      'message': final String message,
      'path': final String path,
      'timestamp': final String timestamp,
    }) {
      final parsedTimestamp = DateTime.tryParse(timestamp);
      if (parsedTimestamp != null) {
        final map = value as Map<String, Object?>;
        return ApiErrorResponse(
          success: false,
          statusCode: statusCode,
          errorCode: errorCode,
          message: message,
          details: map['details'],
          path: path,
          timestamp: parsedTimestamp.toUtc(),
          requestId: map['requestId'] is String ? map['requestId']! as String : null,
        );
      }
    }
    return null;
  }

  final bool success;
  final int statusCode;
  final String errorCode;
  final String message;
  final Object? details;
  final String path;
  final DateTime timestamp;
  final String? requestId;
}
`;
}

function openApiProjection(schema) {
  const properties = Object.fromEntries(Object.entries(schema.properties).map(([name, property]) => {
    if (name === 'success') {
      return [name, { type: 'boolean', enum: [false], description: property.description }];
    }
    if (name === 'details') {
      return [name, { nullable: true, description: property.description }];
    }
    if (name === 'requestId') {
      return [name, { type: 'string', nullable: true, description: property.description }];
    }
    return [name, property];
  }));
  return `${JSON.stringify({
    type: 'object',
    additionalProperties: false,
    properties,
    required: schema.required,
  }, null, 2)}\n`;
}

const rawSchema = await readFile(SCHEMA_PATH, 'utf8');
const schema = JSON.parse(rawSchema);
validateSchema(schema);
const digest = createHash('sha256').update(rawSchema).digest('hex');
const artifacts = new Map([
  ['packages/api-contracts/contract/generated/api-error-response.v1.openapi.json', openApiProjection(schema)],
  ['packages/api-contracts/src/generated/api-error-response.ts', typescript(digest)],
  ['starters/spring/src/main/java/com/enistere/core/contracts/ApiErrorResponse.java', java(digest)],
  ['starters/fastapi/app/contracts/api_error_response.py', python(digest)],
  ['starters/flutter/lib/src/contracts/api_error_response.dart', dart(digest)],
]);

const check = process.argv.includes('--check');
const drift = [];
for (const [relativePath, expected] of artifacts) {
  const path = resolve(REPO_ROOT, relativePath);
  if (check) {
    let current = '';
    try {
      current = await readFile(path, 'utf8');
    } catch {
      // A missing binding is drift, reported with the same path as stale content.
    }
    if (current !== expected) drift.push(relativePath);
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, expected);
  }
}

if (drift.length > 0) {
  console.error(`Generated contract bindings are stale: ${drift.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    mode: check ? 'check' : 'generate',
    schema: SCHEMA_RELATIVE,
    digest,
    artifacts: [...artifacts.keys()],
  }, null, 2));
}
