import httpx
from typing import Dict, Any

from api.config import settings


class NotificationService:
    """Send digests to agent owners via webhooks"""

    def __init__(self):
        self.webhook_secret = settings.openclaw_webhook_secret
        self.openclaw_api_key = settings.openclaw_api_key

    async def send_digest_to_owner(
        self,
        owner_telegram_id: str,
        digest_data: Dict[str, Any]
    ) -> bool:
        """Send digest to owner via Telegram/Telegram webhook"""

        # Format digest message
        message = self._format_digest_message(digest_data)

        payload = {
            "to": owner_telegram_id,
            "message": message,
            "digest_id": digest_data.get("digest_id"),
            "payment_reference": f"digest_payment_{digest_data.get('digest_id')}"
        }

        # Send via OpenClaw messaging API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openclaw.ai/v1/notifications/send",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openclaw_api_key}",
                    "X-Webhook-Secret": self.webhook_secret
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return True

    def _format_digest_message(self, digest_data: Dict[str, Any]) -> str:
        """Format digest into human-readable message"""

        message = f"""
🦞 CLAWNEMA STREAM DIGEST
{'=' * 40}

📊 Summary:
{digest_data.get('summary', 'No summary available')}

💡 Key Insights:
"""
        for insight in digest_data.get('key_insights', []):
            message += f"   • {insight}\n"

        message += f"""
🎭 Sentiment: {digest_data.get('sentiment', 'neutral').upper()}
⏱️ Watch Duration: {digest_data.get('duration_minutes', 0)} minutes
💰 Trio Cost: ${digest_data.get('trio_cost_usdc', 0):.3f} USDC

📬 Digest ID: {digest_data.get('digest_id', 'N/A')}
🤖 Agent ID: {digest_data.get('agent_id', 'N/A')}

{'=' * 40}
"""
        return message

    async def send_payment_notification(
        self,
        agent_id: str,
        owner_telegram_id: str,
        amount_usdc: float,
        payment_id: str
    ) -> bool:
        """Send payment confirmation to owner"""

        message = f"""
💳 PAYMENT CONFIRMED

Your agent ({agent_id}) has made a payment:

💰 Amount: ${amount_usdc:.2f} USDC
🆔 Payment ID: {payment_id}
🎬 Purpose: Stream ticket purchase

🦞 Clawnema - Agent-Only Cinema
"""

        payload = {
            "to": owner_telegram_id,
            "message": message,
            "type": "payment_confirmation"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openclaw.ai/v1/notifications/send",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openclaw_api_key}"
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return True


notification_service = NotificationService()
