"""
Knowledge Graph Service — NetworkX-based graph for domain data.

Manages entities, relationships, and provides query capabilities
for grounding AI predictions in real-world data.
Now supports multiple cities: Hyderabad, Delhi, Bangalore, Mumbai.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import networkx as nx

from app.data.hyderabad_ev import HYDERABAD_EV_DOMAIN
from app.data.delhi import DELHI_EV_DOMAIN
from app.data.bangalore import BANGALORE_EV_DOMAIN
from app.data.mumbai import MUMBAI_EV_DOMAIN

logger = logging.getLogger(__name__)

# Map city names / aliases to domain keys
CITY_ALIASES: dict[str, str] = {
    "hyderabad": "hyderabad_ev_traffic",
    "hyd": "hyderabad_ev_traffic",
    "secunderabad": "hyderabad_ev_traffic",
    "delhi": "delhi_ev_traffic",
    "new delhi": "delhi_ev_traffic",
    "ncr": "delhi_ev_traffic",
    "noida": "delhi_ev_traffic",
    "gurgaon": "delhi_ev_traffic",
    "gurugram": "delhi_ev_traffic",
    "bangalore": "bangalore_ev_traffic",
    "bengaluru": "bangalore_ev_traffic",
    "blr": "bangalore_ev_traffic",
    "mumbai": "mumbai_ev_traffic",
    "bombay": "mumbai_ev_traffic",
}

DOMAIN_CITY_NAME: dict[str, str] = {
    "hyderabad_ev_traffic": "Hyderabad",
    "delhi_ev_traffic": "Delhi",
    "bangalore_ev_traffic": "Bangalore",
    "mumbai_ev_traffic": "Mumbai",
}


class KnowledgeGraphService:
    """In-memory knowledge graph using NetworkX DiGraph."""

    def __init__(self) -> None:
        self.graph = nx.DiGraph()
        self._domains: dict[str, dict] = {}
        self._initialized = False

    def initialize(self) -> None:
        """Load all domain data into the graph."""
        if self._initialized:
            return
        self._load_city_domain("hyderabad", HYDERABAD_EV_DOMAIN)
        self._load_city_domain("delhi", DELHI_EV_DOMAIN)
        self._load_city_domain("bangalore", BANGALORE_EV_DOMAIN)
        self._load_city_domain("mumbai", MUMBAI_EV_DOMAIN)
        self._initialized = True
        logger.info(
            "Knowledge graph initialized: %d nodes, %d edges, %d domains",
            self.graph.number_of_nodes(),
            self.graph.number_of_edges(),
            len(self._domains),
        )

    # ── Domain Loading ──────────────────────────────────────────

    def _load_city_domain(self, city_key: str, domain_data: dict) -> None:
        """Build graph from a city domain data dict (generic for any city)."""
        domain_key = domain_data["domain"]
        self._domains[domain_key] = domain_data

        city_name = domain_data.get("city_name", city_key.title())

        # Root node
        self.add_entity(city_key, "city", {
            "name": city_name,
            "domain": domain_key,
        })

        datasets = domain_data.get("datasets", {})

        # Vehicle registrations
        if "vehicle_registrations" in datasets:
            vr = datasets["vehicle_registrations"]
            node_id = f"{city_key}_vehicle_fleet"
            self.add_entity(node_id, "dataset", {
                "total": vr["total_registered_vehicles"],
                "annual_new": vr["annual_new_registrations"],
                "ev_growth_rate": vr["ev_growth_rate_yoy_percent"],
                "year": vr["year"],
            })
            self.add_relationship(city_key, node_id, "has_fleet")

            for vtype, vdata in vr["breakdown"].items():
                vid = f"{city_key}_vehicle_{vtype}"
                self.add_entity(vid, "vehicle_category", {"name": vtype, **vdata})
                self.add_relationship(node_id, vid, "contains")

        # Air quality
        if "air_quality" in datasets:
            aq = datasets["air_quality"]
            node_id = f"{city_key}_air_quality"
            self.add_entity(node_id, "dataset", {
                "annual_aqi": aq["annual_average_aqi"],
                "pm25": aq["pm25_annual_avg_ugm3"],
                "pm10": aq["pm10_annual_avg_ugm3"],
                "vehicular_share": aq["vehicular_emission_share_percent"],
                "two_wheeler_share_of_vehicular": aq["two_wheeler_emission_share_of_vehicular_percent"],
                "year": aq["year"],
            })
            self.add_relationship(city_key, node_id, "has_air_quality")

            for station in aq.get("monitoring_stations", []):
                sid = f"{city_key}_aqi_{station['name'].lower().replace(' ', '_')}"
                self.add_entity(sid, "monitoring_station", station)
                self.add_relationship(node_id, sid, "monitored_at")

        # EV infrastructure
        if "ev_infrastructure" in datasets:
            ev = datasets["ev_infrastructure"]
            node_id = f"{city_key}_ev_infra"
            self.add_entity(node_id, "dataset", {
                "charging_stations": ev["public_charging_stations"],
                "fast_chargers": ev["fast_charging_stations"],
                "swap_stations": ev["battery_swapping_stations"],
                "grid_capacity": ev["grid_capacity_for_ev_percent"],
                "renewable_share": ev["renewable_energy_in_grid_percent"],
                "planned_2030": ev["planned_stations_by_2030"],
                "year": ev["year"],
            })
            self.add_relationship(city_key, node_id, "has_ev_infra")

        # Traffic
        if "traffic" in datasets:
            traffic = datasets["traffic"]
            node_id = f"{city_key}_traffic"
            self.add_entity(node_id, "dataset", {
                "daily_trips_m": traffic["daily_trips_millions"],
                "avg_commute_min": traffic["average_commute_time_minutes"],
                "peak_speed": traffic["peak_hour_speed_kmph"],
                "two_wheeler_mode_share": traffic["two_wheeler_mode_share_percent"],
                "congestion_cost_crores": traffic["traffic_congestion_cost_crores_annual"],
                "metro_ridership": traffic.get("metro_daily_ridership", 0),
                "accidents_annual": traffic["road_accidents_annual"],
                "year": traffic["year"],
            })
            self.add_relationship(city_key, node_id, "has_traffic_data")

        # Economic
        if "economic" in datasets:
            econ = datasets["economic"]
            node_id = f"{city_key}_economy"
            self.add_entity(node_id, "dataset", {
                "auto_jobs_total": econ["auto_sector_employment"]["total_jobs"],
                "fuel_stations": econ["auto_sector_employment"]["fuel_stations"],
                "fuel_station_employees": econ["auto_sector_employment"]["fuel_station_employees"],
                "daily_petrol_kl": econ["fuel_economy"]["daily_petrol_consumption_kilolitres"],
                "fuel_tax_state_crores": econ["fuel_economy"]["fuel_tax_revenue_state_crores"],
                "ev_market_size_crores": econ["ev_market"]["annual_ev_market_size_crores"],
                "avg_ev_2w_price": econ["ev_market"]["average_electric_two_wheeler_price"],
                "avg_petrol_2w_price": econ["ev_market"]["average_petrol_two_wheeler_price"],
                "year": econ["year"],
            })
            self.add_relationship(city_key, node_id, "has_economic_data")

        # Environment
        if "environmental" in datasets:
            env = datasets["environmental"]
            node_id = f"{city_key}_environment"
            self.add_entity(node_id, "dataset", {
                "transport_co2_tonnes": env["carbon_emissions"]["total_transport_co2_tonnes_annual"],
                "per_petrol_2w_co2": env["carbon_emissions"]["per_petrol_two_wheeler_kg_annual"],
                "per_ev_2w_co2": env["carbon_emissions"]["per_ev_two_wheeler_kg_annual"],
                "noise_peak_db": env["noise_pollution"]["average_db_peak_hours"],
                "noise_2w_share": env["noise_pollution"]["two_wheeler_contribution_percent"],
                "year": env["year"],
            })
            self.add_relationship(city_key, node_id, "has_environment_data")

        # Health
        if "health" in datasets:
            health = datasets["health"]
            node_id = f"{city_key}_health"
            self.add_entity(node_id, "dataset", {
                "respiratory_cases": health["respiratory_diseases_annual_cases"],
                "pollution_deaths": health["air_pollution_attributed_deaths_annual"],
                "healthcare_cost_crores": health["healthcare_cost_air_pollution_crores"],
                "accident_fatalities": health["road_accident_fatalities_annual"],
                "two_wheeler_fatality_share": health["two_wheeler_fatality_share_percent"],
                "year": health["year"],
            })
            self.add_relationship(city_key, node_id, "has_health_data")

    # ── City Detection ──────────────────────────────────────────

    def detect_city(self, query: str) -> tuple[Optional[str], str]:
        """
        Detect city from a natural language query.
        Returns (domain_key, city_name). Falls back to Hyderabad.
        """
        query_lower = query.lower()
        for alias, domain_key in CITY_ALIASES.items():
            if alias in query_lower:
                return domain_key, DOMAIN_CITY_NAME[domain_key]
        # Default to Hyderabad
        return "hyderabad_ev_traffic", "Hyderabad"

    def get_city_list(self) -> list[dict[str, str]]:
        """Return list of available cities."""
        return [
            {"key": dk, "name": cn}
            for dk, cn in DOMAIN_CITY_NAME.items()
        ]

    # ── Graph Operations ────────────────────────────────────────

    def add_entity(
        self,
        entity_id: str,
        entity_type: str,
        attributes: dict[str, Any],
    ) -> None:
        """Add a node to the knowledge graph."""
        self.graph.add_node(entity_id, type=entity_type, **attributes)

    def add_relationship(
        self,
        source_id: str,
        target_id: str,
        relationship: str,
        attributes: Optional[dict[str, Any]] = None,
    ) -> None:
        """Add a directed edge between two entities."""
        self.graph.add_edge(
            source_id, target_id,
            relationship=relationship,
            **(attributes or {}),
        )

    def get_entity(self, entity_id: str) -> Optional[dict[str, Any]]:
        """Retrieve a single entity and its attributes."""
        if entity_id in self.graph:
            return dict(self.graph.nodes[entity_id])
        return None

    def query_related(
        self,
        entity_id: str,
        relationship: Optional[str] = None,
        depth: int = 1,
    ) -> dict[str, Any]:
        """
        Get entities related to the given entity.

        Args:
            entity_id: Starting node
            relationship: Filter by edge type (optional)
            depth: How many hops to traverse (default 1)

        Returns:
            Dict with related entities and their attributes
        """
        if entity_id not in self.graph:
            return {"entity": entity_id, "related": []}

        related = []
        visited = set()

        def _traverse(node_id: str, current_depth: int) -> None:
            if current_depth > depth or node_id in visited:
                return
            visited.add(node_id)

            for _, target, edge_data in self.graph.out_edges(node_id, data=True):
                edge_rel = edge_data.get("relationship", "")
                if relationship and edge_rel != relationship:
                    continue
                target_data = dict(self.graph.nodes[target])
                related.append({
                    "id": target,
                    "relationship": edge_rel,
                    "attributes": target_data,
                })
                if current_depth < depth:
                    _traverse(target, current_depth + 1)

        _traverse(entity_id, 1)
        return {"entity": entity_id, "related": related}

    def get_domain_data(self, domain: str) -> Optional[dict[str, Any]]:
        """Get raw domain data dictionary."""
        return self._domains.get(domain)

    def get_domain_summary(self, domain: str) -> dict[str, Any]:
        """Get a summary of all data available for a domain, suitable for LLM context."""
        domain_data = self._domains.get(domain)
        if not domain_data:
            return {"available": False, "domain": domain}

        return {
            "available": True,
            "domain": domain,
            "datasets": {
                key: self._summarize_dataset(data)
                for key, data in domain_data.get("datasets", {}).items()
            },
        }

    def _summarize_dataset(self, data: dict) -> dict[str, Any]:
        """Create a concise summary of a dataset for LLM context."""
        summary = {}
        for key, value in data.items():
            if key in ("source", "year"):
                summary[key] = value
            elif isinstance(value, dict):
                summary[key] = {
                    k: v for k, v in value.items()
                    if not isinstance(v, dict)
                }
            elif isinstance(value, list):
                summary[key] = f"[{len(value)} items]"
            else:
                summary[key] = value
        return summary

    def calculate_ev_ban_impact(
        self,
        vehicle_type: str = "two_wheelers",
        ban_year: int = 2030,
        domain: str = "hyderabad_ev_traffic",
    ) -> dict[str, Any]:
        """
        Calculate concrete impacts of banning petrol vehicles of a given type.
        Now city-aware — pass the domain key to pick the right city data.
        """
        domain_data = self._domains.get(domain)
        if not domain_data:
            return {"error": f"Domain data not loaded for {domain}"}

        city_name = DOMAIN_CITY_NAME.get(domain, domain)

        vr = domain_data["datasets"]["vehicle_registrations"]
        aq = domain_data["datasets"]["air_quality"]
        env = domain_data["datasets"]["environmental"]
        econ = domain_data["datasets"]["economic"]
        health = domain_data["datasets"]["health"]
        traffic = domain_data["datasets"]["traffic"]

        vehicle_data = vr["breakdown"].get(vehicle_type, {})
        petrol_count = vehicle_data.get("petrol", 0)
        total_vehicles = vr["total_registered_vehicles"]
        years_to_ban = max(ban_year - vr["year"], 1)

        # ── Environmental calculations ──
        co2_per_petrol = env["carbon_emissions"].get(
            f"per_petrol_{vehicle_type.rstrip('s').replace('_wheeler', '')}_wheeler_kg_annual",
            env["carbon_emissions"].get("per_petrol_two_wheeler_kg_annual", 420),
        )
        co2_per_ev = env["carbon_emissions"].get(
            f"per_ev_{vehicle_type.rstrip('s').replace('_wheeler', '')}_wheeler_kg_annual",
            env["carbon_emissions"].get("per_ev_two_wheeler_kg_annual", 85),
        )

        co2_reduction_kg = petrol_count * (co2_per_petrol - co2_per_ev)
        co2_reduction_tonnes = co2_reduction_kg / 1000
        co2_reduction_percent = (
            co2_reduction_tonnes / env["carbon_emissions"]["total_transport_co2_tonnes_annual"]
        ) * 100

        vehicular_share = aq["vehicular_emission_share_percent"] / 100
        vehicle_type_share = aq.get(
            "two_wheeler_emission_share_of_vehicular_percent", 32
        ) / 100
        aqi_reduction = aq["annual_average_aqi"] * vehicular_share * vehicle_type_share * 0.7
        new_aqi = aq["annual_average_aqi"] - aqi_reduction

        noise_reduction_db = (
            env["noise_pollution"]["average_db_peak_hours"]
            * (env["noise_pollution"]["two_wheeler_contribution_percent"] / 100)
            * 0.6
        )

        # ── Economic calculations ──
        petrol_share_of_consumption = petrol_count / max(
            sum(cat.get("petrol", 0) for cat in vr["breakdown"].values()), 1
        )
        fuel_revenue_loss_crores = (
            econ["fuel_economy"]["annual_fuel_revenue_crores"]
            * petrol_share_of_consumption
        )
        fuel_tax_loss_crores = (
            econ["fuel_economy"]["fuel_tax_revenue_state_crores"]
            * petrol_share_of_consumption
        )

        jobs_at_risk = int(
            econ["auto_sector_employment"]["fuel_station_employees"]
            * petrol_share_of_consumption
            + econ["auto_sector_employment"]["mechanics_workshops"] * 0.4
        )

        ev_market_growth_crores = petrol_count * (
            econ["ev_market"]["average_electric_two_wheeler_price"] / 10_000_000
        )

        # ── Traffic calculations ──
        accident_reduction = int(
            traffic["road_accidents_annual"]
            * (traffic.get("two_wheeler_accident_share_percent", 42) / 100)
            * 0.25
        )

        # ── Health calculations ──
        health_cost_savings_crores = (
            health["healthcare_cost_air_pollution_crores"]
            * vehicular_share * vehicle_type_share * 0.5
        )
        lives_saved_estimate = int(
            health["air_pollution_attributed_deaths_annual"]
            * vehicular_share * vehicle_type_share * 0.4
        )

        return {
            "scenario": f"Ban petrol {vehicle_type.replace('_', ' ')} by {ban_year}",
            "city": city_name,
            "vehicles_affected": petrol_count,
            "transition_period_years": years_to_ban,
            "environmental": {
                "co2_reduction_tonnes_annual": round(co2_reduction_tonnes),
                "co2_reduction_percent": round(co2_reduction_percent, 1),
                "aqi_improvement": round(aq["annual_average_aqi"] - new_aqi, 1),
                "new_estimated_aqi": round(new_aqi, 1),
                "noise_reduction_db": round(noise_reduction_db, 1),
            },
            "economic": {
                "fuel_revenue_loss_crores_annual": round(fuel_revenue_loss_crores),
                "fuel_tax_loss_crores_annual": round(fuel_tax_loss_crores),
                "jobs_at_risk": jobs_at_risk,
                "ev_market_opportunity_crores": round(ev_market_growth_crores),
                "infrastructure_investment_needed_crores": round(
                    econ["ev_market"]["average_electric_two_wheeler_price"]
                    * petrol_count / 10_000_000 * 0.15
                ),
            },
            "health": {
                "healthcare_savings_crores_annual": round(health_cost_savings_crores),
                "estimated_lives_saved_annual": lives_saved_estimate,
                "accident_reduction_annual": accident_reduction,
            },
            "traffic": {
                "vehicles_transitioning": petrol_count,
                "estimated_accident_reduction": accident_reduction,
                "congestion_impact": "mixed",
            },
            "data_year": vr["year"],
            "source": "calculated",
        }

    def get_available_domains(self) -> list[str]:
        """List all loaded domains."""
        return list(self._domains.keys())

    def get_stats(self) -> dict[str, int]:
        """Get graph statistics."""
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "domains": len(self._domains),
        }


# Singleton instance
knowledge_graph = KnowledgeGraphService()
