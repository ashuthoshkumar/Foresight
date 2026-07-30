import urllib.request
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Coordinates for target cities in Foresight domain
CITY_COORDINATES = {
    "hyderabad": {"lat": 17.3850, "lon": 78.4867},
    "delhi": {"lat": 28.7041, "lon": 77.1025},
    "bangalore": {"lat": 12.9716, "lon": 77.5946},
    "mumbai": {"lat": 19.0760, "lon": 72.8777}
}

def fetch_live_aqi(city: str) -> Dict[str, Any]:
    """
    Fetch current real-time Air Quality Index metrics for a given city 
    from the Open-Meteo Air Quality API (open-access, no keys required).
    """
    city_key = city.lower().strip()
    coords = CITY_COORDINATES.get(city_key)
    if not coords:
        logger.warning(f"Coordinates not found for city: {city}")
        return {}

    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={coords['lat']}&longitude={coords['lon']}&current=pm2_5,pm10,us_aqi"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Foresight/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            current = data.get("current", {})
            aqi = current.get("us_aqi")
            pm25 = current.get("pm2_5")
            pm10 = current.get("pm10")
            if aqi is not None:
                logger.info(f"Fetched live AQI for {city}: AQI={aqi}, PM2.5={pm25}, PM10={pm10}")
                return {
                    "live_aqi": int(aqi),
                    "live_pm25": float(pm25),
                    "live_pm10": float(pm10),
                    "source": "Open-Meteo Real-time API"
                }
    except Exception as e:
        logger.warning(f"Error fetching live API data for {city}: {e}. Falling back to default datasets.")
    return {}
