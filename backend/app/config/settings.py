import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Polis API"
    ENV: str = "development"
    DEBUG: bool = True

    # Database connection string
    # Default to local sqlite
    DATABASE_URL: str = "sqlite:///./polis.db"

    # CORS configuration
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        return v

    # AWS Settings for production deployment
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Union[str, None] = None
    AWS_SECRET_ACCESS_KEY: Union[str, None] = None
    BUCKET_NAME: Union[str, None] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
