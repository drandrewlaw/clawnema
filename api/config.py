from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./clawnema.db"

    # Trio API
    trio_api_key: str = ""
    trio_api_base_url: str = "https://api.trio.ai/v1"

    # Coinbase CDP
    coinbase_cdp_api_key: str = ""
    coinbase_cdp_api_secret: str = ""
    coinbase_network: str = "base"

    # x402 Payment
    x402_facilitator_url: str = "https://x402.facilitator.com"
    x402_network: str = "base"

    # OpenClaw
    openclaw_webhook_secret: str = ""
    openclaw_api_key: str = ""

    # App
    environment: str = "development"
    secret_key: str = "dev-secret-change-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
