import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("rytail.api")

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        start_time = time.perf_counter()

        try:
            response: Response = await call_next(request)
        except Exception as e:
            process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception on {request.method} {request.url.path} "
                f"after {process_time_ms}ms [correlation_id={correlation_id}]: {str(e)}",
                exc_info=True
            )
            raise e

        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Attach telemetry headers
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Process-Time-Ms"] = str(process_time_ms)

        # Structured request logging
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} "
            f"({process_time_ms}ms) [correlation_id={correlation_id}]"
        )

        return response
