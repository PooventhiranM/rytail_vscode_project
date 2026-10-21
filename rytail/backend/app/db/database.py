from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
import logging

logger = logging.getLogger("rytail.database")

# Build engine with production optimizations
is_sqlite = "sqlite" in settings.DATABASE_URL.lower()

engine_kwargs = {
    "pool_pre_ping": settings.DB_POOL_PRE_PING,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {
        "check_same_thread": False,
        "timeout": settings.DB_TIMEOUT_SECONDS
    }

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

# Optimize SQLite for concurrent reading/writing via WAL mode & busy timeout
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=10000")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        except Exception as e:
            logger.warning(f"Could not configure SQLite pragmas: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
