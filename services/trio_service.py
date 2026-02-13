import httpx
from typing import List, Dict, Any, Optional
import base64

from api.config import settings


class TrioService:
    """Trio Multimodal API Client"""

    def __init__(self):
        self.api_key = settings.trio_api_key
        self.base_url = settings.trio_api_base_url
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def analyze_visual(self, image_data: bytes) -> Dict[str, Any]:
        """Analyze visual content from image data"""
        image_b64 = base64.b64encode(image_data).decode()

        payload = {
            "image": f"data:image/jpeg;base64,{image_b64}",
            "tasks": ["scene_detection", "object_recognition", "person_tracking"]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/analyze/visual",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def analyze_audio(self, audio_data: bytes) -> Dict[str, Any]:
        """Analyze audio content"""
        audio_b64 = base64.b64encode(audio_data).decode()

        payload = {
            "audio": f"data:audio/mpeg;base64,{audio_b64}",
            "tasks": ["speech_detection", "music_classification", "sentiment"]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/analyze/audio",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text content (captions, OCR, chat)"""
        payload = {
            "text": text,
            "tasks": ["sentiment_analysis", "entity_extraction", "topic_classification"]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/analyze/text",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def generate_digest(self, analyses: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a live digest from multimodal analyses"""
        payload = {
            "visual": analyses.get("visual", {}),
            "audio": analyses.get("audio", {}),
            "text": analyses.get("text", {}),
            "format": "summary"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/digest/generate",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_cost_estimate(self, analyses: List[str]) -> float:
        """Get cost estimate for Trio API calls"""
        # Base costs (adjust based on actual Trio pricing)
        cost_per_visual = 0.01
        cost_per_audio = 0.005
        cost_per_text = 0.003

        total_cost = 0.0
        for analysis in analyses:
            if analysis == "visual":
                total_cost += cost_per_visual
            elif analysis == "audio":
                total_cost += cost_per_audio
            elif analysis == "text":
                total_cost += cost_per_text

        return total_cost


trio_service = TrioService()
