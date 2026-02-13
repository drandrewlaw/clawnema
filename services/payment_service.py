import httpx
from typing import Optional
import uuid

from api.config import settings


class X402PaymentService:
    """x402 Payment Protocol Handler with Coinbase CDP"""

    def __init__(self):
        self.facilitator_url = settings.x402_facilitator_url
        self.coinbase_api_key = settings.coinbase_cdp_api_key
        self.coinbase_api_secret = settings.coinbase_cdp_api_secret
        self.network = settings.x402_network

    async def create_payment_request(
        self,
        amount_usdc: float,
        agent_wallet: str,
        resource_id: str
    ) -> Dict[str, Any]:
        """Create x402 payment request (HTTP 402)"""

        payload = {
            "amount": str(amount_usdc),
            "currency": "USDC",
            "network": self.network,
            "sender_address": agent_wallet,
            "recipient_address": self.get_clawnema_wallet(),
            "resource_id": resource_id,
            "metadata": {
                "service": "clawnema",
                "payment_type": "ticket_purchase"
            }
        }

        # Create payment request with facilitator
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.facilitator_url}/payment/create",
                headers={
                    "Content-Type": "application/json",
                    "X-Coinbase-Api-Key": self.coinbase_api_key,
                    "X-Coinbase-Api-Secret": self.coinbase_api_secret
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def verify_payment(self, payment_id: str) -> Dict[str, Any]:
        """Verify if payment was settled"""

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.facilitator_url}/payment/{payment_id}/verify",
                headers={
                    "X-Coinbase-Api-Key": self.coinbase_api_key,
                    "X-Coinbase-Api-Secret": self.coinbase_api_secret
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_wallet_balance(self, wallet_address: str) -> float:
        """Get USDC balance for agent wallet using Coinbase CDP"""

        payload = {
            "network": self.network,
            "token_address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bDA02913",  # USDC on Base
            "wallet_address": wallet_address
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.cdp.coinbase.com/wallets/balance",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.coinbase_api_key}"
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return float(data.get("balance", "0"))

    async def create_agentic_wallet(self, agent_id: str) -> Dict[str, Any]:
        """Create new agentic wallet using Coinbase CDP"""

        payload = {
            "network": self.network,
            "metadata": {
                "agent_id": agent_id,
                "service": "clawnema"
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.cdp.coinbase.com/wallets/agentic",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.coinbase_api_key}"
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    def get_clawnema_wallet(self) -> str:
        """Get Clawnema's recipient wallet address"""
        # In production, this should be from environment or config
        return "0xClawnemaTreasuryAddressOnBase"

    def generate_payment_id(self) -> str:
        """Generate unique payment ID"""
        return f"pay_{uuid.uuid4().hex[:16]}"


x402_service = X402PaymentService()
