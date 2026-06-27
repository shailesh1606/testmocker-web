import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27018"
    database_name: str = "testmocker"
    jwt_secret: str = "your_secret_key"
    jwt_expire_hours: int = 48
    openai_api_key: str = "dummy_key"
    pdf_storage_path: str = "./uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()

# Make sure upload dir exists
os.makedirs(settings.pdf_storage_path, exist_ok=True)
