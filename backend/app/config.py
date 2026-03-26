from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "NovaOps API"
    debug: bool = False
    secret_key: str = "change-me-in-production"
    allowed_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
