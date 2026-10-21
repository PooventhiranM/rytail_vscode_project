from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
import logging

logger = logging.getLogger("rytail.errors")

async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail if isinstance(exc.detail, str) else "Request error",
                "details": exc.detail if not isinstance(exc.detail, str) else None,
                "correlation_id": correlation_id,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        },
        headers={"X-Correlation-ID": correlation_id}
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })

    logger.warning(
        f"Validation error on {request.method} {request.url.path} "
        f"[correlation_id={correlation_id}]: {errors}"
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed for the requested resource",
                "details": errors,
                "correlation_id": correlation_id,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        },
        headers={"X-Correlation-ID": correlation_id}
    )

async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    logger.error(
        f"Critical server error on {request.method} {request.url.path} "
        f"[correlation_id={correlation_id}]: {str(exc)}",
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected system error occurred. Please contact support with the correlation ID.",
                "correlation_id": correlation_id,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        },
        headers={"X-Correlation-ID": correlation_id}
    )
