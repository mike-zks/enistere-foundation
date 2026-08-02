// GENERATED FROM contracts/schemas/api-error-response.v1.schema.json. DO NOT EDIT.
// schema-sha256: a3d0ff5ddb530f42843cc4f6d88b994d104d3a677aa99a5c35695fc37414b15c
export interface ApiErrorResponse {
  readonly success: false;
  readonly statusCode: number;
  readonly errorCode: string;
  readonly message: string;
  readonly details?: unknown;
  readonly path: string;
  readonly timestamp: string;
  readonly requestId?: string | null;
}
