# GENERATED FROM contracts/schemas/api-error-response.v1.schema.json. DO NOT EDIT.
# schema-sha256: a3d0ff5ddb530f42843cc4f6d88b994d104d3a677aa99a5c35695fc37414b15c
from __future__ import annotations

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
