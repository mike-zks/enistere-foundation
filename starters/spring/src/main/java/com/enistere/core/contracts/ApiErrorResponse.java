// GENERATED FROM contracts/schemas/api-error-response.v1.schema.json. DO NOT EDIT.
// schema-sha256: a3d0ff5ddb530f42843cc4f6d88b994d104d3a677aa99a5c35695fc37414b15c
package com.enistere.core.contracts;

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
