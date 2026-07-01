# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# The connection string uses the format: postgresql://user:password@host/database_name
SQLALCHEMY_DATABASE_URL = "postgresql://artha_admin:securepassword123@localhost/arthasaathi"

# Initialize the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a local session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models to inherit from
Base = declarative_base()

# Dependency to get the database session in our FastAPI endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

