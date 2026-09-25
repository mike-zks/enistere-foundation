from fastapi import Request
from fastapi.responses import JSONResponse

from app.contracts import ApiErrorResponse

from .errors import FilesError


async def files_error_handler(request: Request, error: Exception) -> JSONResponse:
    failure = error if isinstance(error, FilesError) else FilesError(500, "INTERNAL_ERROR", "")
    response = ApiErrorResponse.create(
        status_code=failure.status_code,
        error_code=failure.error_code,
        message=failure.message,
        details=None,
        path=request.url.path,
        request_id=getattr(request.state, "request_id", None),
    )
    return JSONResponse(status_code=failure.status_code, content=response.to_dict())
