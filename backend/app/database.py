import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# Normalize URL for psycopg3 (psycopg[binary]).
# SQLAlchemy requires the +psycopg dialect suffix; legacy postgresql:// targets psycopg2.
# Some cloud providers also emit postgres:// — handle that too.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg" + DATABASE_URL[len("postgres"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg" + DATABASE_URL[len("postgresql"):]
# If it already contains +psycopg (e.g. docker-compose passes the correct form) leave it alone.

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
