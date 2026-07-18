"""
Hyderabad EV/Traffic Domain — Seed Data for Knowledge Graph.

Contains realistic data points based on publicly available statistics about
Hyderabad's transportation ecosystem, used to ground AI predictions in facts.
"""

# ── Vehicle Registration Data (Hyderabad Metropolitan Area) ──────────

VEHICLE_REGISTRATIONS = {
    "total_registered_vehicles": 12_800_000,
    "breakdown": {
        "two_wheelers": {
            "total": 8_200_000,
            "petrol": 7_950_000,
            "electric": 250_000,
            "percentage_of_total": 64.1,
        },
        "four_wheelers": {
            "total": 3_100_000,
            "petrol": 1_800_000,
            "diesel": 1_100_000,
            "cng": 50_000,
            "electric": 150_000,
            "percentage_of_total": 24.2,
        },
        "auto_rickshaws": {
            "total": 650_000,
            "petrol": 200_000,
            "diesel": 50_000,
            "cng": 350_000,
            "electric": 50_000,
            "percentage_of_total": 5.1,
        },
        "buses": {
            "total": 12_500,
            "diesel": 10_000,
            "cng": 1_500,
            "electric": 1_000,
            "percentage_of_total": 0.1,
        },
        "commercial_vehicles": {
            "total": 837_500,
            "diesel": 750_000,
            "petrol": 62_500,
            "electric": 25_000,
            "percentage_of_total": 6.5,
        },
    },
    "annual_new_registrations": 850_000,
    "ev_growth_rate_yoy_percent": 45,
    "year": 2025,
    "source": "Telangana Transport Department (approximated)",
}

# ── Air Quality Data ─────────────────────────────────────────────────

AIR_QUALITY = {
    "annual_average_aqi": 142,
    "aqi_category": "Unhealthy for Sensitive Groups",
    "pm25_annual_avg_ugm3": 55.2,
    "pm10_annual_avg_ugm3": 98.7,
    "no2_annual_avg_ugm3": 42.3,
    "co_annual_avg_mgm3": 1.8,
    "vehicular_emission_share_percent": 38,
    "two_wheeler_emission_share_of_vehicular_percent": 32,
    "industrial_emission_share_percent": 28,
    "construction_emission_share_percent": 18,
    "other_emission_share_percent": 16,
    "monitoring_stations": [
        {"name": "Jubilee Hills", "avg_aqi": 128},
        {"name": "Abids", "avg_aqi": 156},
        {"name": "Kukatpally", "avg_aqi": 148},
        {"name": "Uppal", "avg_aqi": 138},
        {"name": "Secunderabad", "avg_aqi": 135},
        {"name": "LB Nagar", "avg_aqi": 152},
    ],
    "year": 2025,
    "source": "CPCB / Telangana Pollution Control Board (approximated)",
}

# ── EV Infrastructure ───────────────────────────────────────────────

EV_INFRASTRUCTURE = {
    "public_charging_stations": 1_850,
    "fast_charging_stations": 420,
    "battery_swapping_stations": 180,
    "home_charging_penetration_percent": 65,
    "average_charging_time_hours": {
        "slow_ac": 8,
        "fast_dc": 1.5,
        "ultra_fast": 0.5,
    },
    "grid_capacity_for_ev_percent": 72,
    "renewable_energy_in_grid_percent": 28,
    "planned_stations_by_2030": 15_000,
    "investment_in_infrastructure_crores": 2_500,
    "year": 2025,
    "source": "GHMC / Ministry of Power (approximated)",
}

# ── Traffic & Commute Data ──────────────────────────────────────────

TRAFFIC_DATA = {
    "daily_trips_millions": 18.5,
    "average_commute_time_minutes": 42,
    "peak_hour_speed_kmph": 14,
    "off_peak_speed_kmph": 32,
    "two_wheeler_mode_share_percent": 45,
    "four_wheeler_mode_share_percent": 22,
    "public_transport_mode_share_percent": 18,
    "auto_rickshaw_mode_share_percent": 8,
    "walking_cycling_mode_share_percent": 7,
    "road_network_km": 9_500,
    "metro_route_km": 69.2,
    "metro_daily_ridership": 450_000,
    "tsrtc_daily_ridership": 3_200_000,
    "traffic_congestion_cost_crores_annual": 18_000,
    "road_accidents_annual": 4_200,
    "two_wheeler_accident_share_percent": 42,
    "year": 2025,
    "source": "Hyderabad Traffic Police / HMDA (approximated)",
}

# ── Economic Indicators ─────────────────────────────────────────────

ECONOMIC_DATA = {
    "auto_sector_employment": {
        "total_jobs": 285_000,
        "dealerships_service_petrol": 12_500,
        "fuel_stations": 3_200,
        "fuel_station_employees": 28_000,
        "mechanics_workshops": 18_000,
        "auto_parts_retail": 8_500,
        "ev_ecosystem_jobs": 15_000,
    },
    "fuel_economy": {
        "daily_petrol_consumption_kilolitres": 4_200,
        "daily_diesel_consumption_kilolitres": 3_800,
        "petrol_price_per_litre": 109.66,
        "diesel_price_per_litre": 97.82,
        "annual_fuel_revenue_crores": 32_000,
        "fuel_tax_revenue_state_crores": 8_500,
        "fuel_tax_revenue_central_crores": 12_000,
    },
    "ev_market": {
        "average_electric_two_wheeler_price": 125_000,
        "average_petrol_two_wheeler_price": 85_000,
        "ev_subsidy_per_vehicle": 15_000,
        "annual_ev_market_size_crores": 3_200,
        "ev_battery_cost_trend_yoy_decline_percent": 12,
    },
    "gdp_contribution_transport_percent": 8.5,
    "year": 2025,
    "source": "RBI / Telangana Economic Survey (approximated)",
}

# ── Environmental Factors ───────────────────────────────────────────

ENVIRONMENTAL_FACTORS = {
    "carbon_emissions": {
        "total_transport_co2_tonnes_annual": 8_500_000,
        "per_petrol_two_wheeler_kg_annual": 420,
        "per_diesel_car_kg_annual": 2_800,
        "per_petrol_car_kg_annual": 2_100,
        "per_ev_two_wheeler_kg_annual": 85,
        "per_ev_car_kg_annual": 480,
    },
    "noise_pollution": {
        "average_db_peak_hours": 82,
        "two_wheeler_contribution_percent": 35,
        "safe_threshold_db": 70,
    },
    "green_cover": {
        "total_green_cover_percent": 9.2,
        "target_green_cover_percent": 33,
        "road_space_percent_of_city": 12,
    },
    "year": 2025,
    "source": "Telangana Forest Department / CPCB (approximated)",
}

# ── Public Health Data ──────────────────────────────────────────────

HEALTH_DATA = {
    "respiratory_diseases_annual_cases": 1_850_000,
    "air_pollution_attributed_deaths_annual": 4_200,
    "healthcare_cost_air_pollution_crores": 3_500,
    "noise_related_health_issues_annual": 280_000,
    "road_accident_fatalities_annual": 1_150,
    "road_accident_injuries_annual": 8_500,
    "two_wheeler_fatality_share_percent": 45,
    "year": 2025,
    "source": "Telangana Health Department (approximated)",
}

# ── Aggregate all domain data ────────────────────────────────────────

HYDERABAD_EV_DOMAIN = {
    "domain": "hyderabad_ev_traffic",
    "description": "Hyderabad metropolitan area — EV adoption, traffic, and environmental data",
    "datasets": {
        "vehicle_registrations": VEHICLE_REGISTRATIONS,
        "air_quality": AIR_QUALITY,
        "ev_infrastructure": EV_INFRASTRUCTURE,
        "traffic": TRAFFIC_DATA,
        "economic": ECONOMIC_DATA,
        "environmental": ENVIRONMENTAL_FACTORS,
        "health": HEALTH_DATA,
    },
}
