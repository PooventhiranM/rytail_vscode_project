from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import engine, Base
from app.db.seed_data import seed_database
from app.middleware.correlation import CorrelationIdMiddleware
from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler
)
from app.api.v1 import (
    auth, products, stores, inventory, sales, allocation,
    replenishment, transfers, planning, approvals, config_api,
    data_quality, audit, copilot, warehouses, scanner, cycle_counts,
    connectors, gcs, health
)
import logging

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("rytail.main")

# Initialize Database tables and Seed data
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    logger.info(f"Database seed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI retail inventory intelligence and store replenishment platform developed for Style Union.",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Telemetry & Correlation ID Middleware (always first)
app.add_middleware(CorrelationIdMiddleware)

# 2. Production CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=settings.ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Process-Time-Ms"]
)

# 3. Global Exception Handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# 4. Register Health & Telemetry Routes
app.include_router(health.router)

# 5. Register Core API V1 Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(products.router, prefix=api_v1)
app.include_router(stores.router, prefix=api_v1)
app.include_router(inventory.router, prefix=api_v1)
app.include_router(sales.router, prefix=api_v1)
app.include_router(allocation.router, prefix=api_v1)
app.include_router(replenishment.router, prefix=api_v1)
app.include_router(transfers.router, prefix=api_v1)
app.include_router(planning.router, prefix=api_v1)
app.include_router(approvals.router, prefix=api_v1)
app.include_router(config_api.router, prefix=api_v1)
app.include_router(data_quality.router, prefix=api_v1)
app.include_router(audit.router, prefix=api_v1)
app.include_router(copilot.router, prefix=api_v1)
app.include_router(warehouses.router, prefix=api_v1)
app.include_router(scanner.router, prefix=api_v1)
app.include_router(cycle_counts.router, prefix=api_v1)
app.include_router(connectors.router, prefix=api_v1)
app.include_router(gcs.router, prefix=api_v1)

@app.get("/", summary="Root Status")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "health": "/healthz",
        "readiness": "/readyz"
    }
