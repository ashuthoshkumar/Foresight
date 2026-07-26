"""
Delhi EV/Traffic Domain — Seed Data for Knowledge Graph.

Contains realistic data points based on publicly available statistics about
Delhi's transportation ecosystem, used to ground AI predictions in facts.
"""

VEHICLE_REGISTRATIONS = {
    "total_registered_vehicles": 14_500_000,
    "breakdown": {
        "two_wheelers": {
            "total": 8_900_000,
            "petrol": 8_600_000,
            "electric": 300_000,
            "percentage_of_total": 61.4,
        },
        "four_wheelers": {
            "total": 3_800_000,
            "petrol": 2_200_000,
            "diesel": 1_300_000,
            "cng": 200_000,
            "electric": 100_000,
            "percentage_of_total": 26.2,
        },
        "auto_rickshaws": {
            "total": 100_000,
            "petrol": 10_000,
            "diesel": 5_000,
            "cng": 80_000,
            "electric": 5_000,
            "percentage_of_total": 0.7,
        },
        "buses": {
            "total": 15_000,
            "diesel": 6_000,
            "cng": 7_000,
            "electric": 2_000,
            "percentage_of_total": 0.1,
        },
        "commercial_vehicles": {
            "total": 1_700_000,
            "diesel": 1_500_000,
            "petrol": 150_000,
            "electric": 50_000,
            "percentage_of_total": 11.7,
        },
    },
    "annual_new_registrations": 950_000,
    "ev_growth_rate_yoy_percent": 55,
    "year": 2025,
    "source": "Delhi Transport Department (approximated)",
}

AIR_QUALITY = {
    "annual_average_aqi": 205,
    "aqi_category": "Very Unhealthy",
    "pm25_annual_avg_ugm3": 99.5,
    "pm10_annual_avg_ugm3": 180.2,
    "no2_annual_avg_ugm3": 52.8,
    "co_annual_avg_mgm3": 2.5,
    "vehicular_emission_share_percent": 42,
    "two_wheeler_emission_share_of_vehicular_percent": 28,
    "industrial_emission_share_percent": 22,
    "construction_emission_share_percent": 16,
    "other_emission_share_percent": 20,
    "monitoring_stations": [
        {"name": "Anand Vihar", "avg_aqi": 285},
        {"name": "ITO", "avg_aqi": 220},
        {"name": "Dwarka", "avg_aqi": 178},
        {"name": "R K Puram", "avg_aqi": 195},
        {"name": "Nehru Nagar", "avg_aqi": 210},
        {"name": "Punjabi Bagh", "avg_aqi": 198},
    ],
    "year": 2025,
    "source": "CPCB / DPCC (approximated)",
}

EV_INFRASTRUCTURE = {
    "public_charging_stations": 2_800,
    "fast_charging_stations": 750,
    "battery_swapping_stations": 350,
    "home_charging_penetration_percent": 55,
    "average_charging_time_hours": {
        "slow_ac": 8,
        "fast_dc": 1.5,
        "ultra_fast": 0.5,
    },
    "grid_capacity_for_ev_percent": 65,
    "renewable_energy_in_grid_percent": 22,
    "planned_stations_by_2030": 18_000,
    "investment_in_infrastructure_crores": 4_500,
    "year": 2025,
    "source": "Delhi Govt / BSES / Ministry of Power (approximated)",
}

TRAFFIC_DATA = {
    "daily_trips_millions": 26.0,
    "average_commute_time_minutes": 58,
    "peak_hour_speed_kmph": 11,
    "off_peak_speed_kmph": 28,
    "two_wheeler_mode_share_percent": 38,
    "four_wheeler_mode_share_percent": 28,
    "public_transport_mode_share_percent": 22,
    "auto_rickshaw_mode_share_percent": 5,
    "walking_cycling_mode_share_percent": 7,
    "road_network_km": 33_000,
    "metro_route_km": 392,
    "metro_daily_ridership": 6_000_000,
    "dtc_daily_ridership": 4_000_000,
    "traffic_congestion_cost_crores_annual": 40_000,
    "road_accidents_annual": 6_200,
    "two_wheeler_accident_share_percent": 38,
    "year": 2025,
    "source": "Delhi Traffic Police / DMRC (approximated)",
}

ECONOMIC_DATA = {
    "auto_sector_employment": {
        "total_jobs": 420_000,
        "dealerships_service_petrol": 18_000,
        "fuel_stations": 4_800,
        "fuel_station_employees": 42_000,
        "mechanics_workshops": 25_000,
        "auto_parts_retail": 12_000,
        "ev_ecosystem_jobs": 22_000,
    },
    "fuel_economy": {
        "daily_petrol_consumption_kilolitres": 6_500,
        "daily_diesel_consumption_kilolitres": 5_200,
        "petrol_price_per_litre": 94.72,
        "diesel_price_per_litre": 87.62,
        "annual_fuel_revenue_crores": 48_000,
        "fuel_tax_revenue_state_crores": 6_200,
        "fuel_tax_revenue_central_crores": 18_000,
    },
    "ev_market": {
        "average_electric_two_wheeler_price": 120_000,
        "average_petrol_two_wheeler_price": 82_000,
        "ev_subsidy_per_vehicle": 22_500,
        "annual_ev_market_size_crores": 5_200,
        "ev_battery_cost_trend_yoy_decline_percent": 14,
    },
    "gdp_contribution_transport_percent": 9.0,
    "year": 2025,
    "source": "RBI / Delhi Economic Survey (approximated)",
}

ENVIRONMENTAL_FACTORS = {
    "carbon_emissions": {
        "total_transport_co2_tonnes_annual": 12_000_000,
        "per_petrol_two_wheeler_kg_annual": 400,
        "per_diesel_car_kg_annual": 2_900,
        "per_petrol_car_kg_annual": 2_200,
        "per_ev_two_wheeler_kg_annual": 95,
        "per_ev_car_kg_annual": 520,
    },
    "noise_pollution": {
        "average_db_peak_hours": 85,
        "two_wheeler_contribution_percent": 30,
        "safe_threshold_db": 70,
    },
    "green_cover": {
        "total_green_cover_percent": 21.9,
        "target_green_cover_percent": 33,
        "road_space_percent_of_city": 21,
    },
    "year": 2025,
    "source": "Delhi Forest Department / CPCB (approximated)",
}

HEALTH_DATA = {
    "respiratory_diseases_annual_cases": 3_200_000,
    "air_pollution_attributed_deaths_annual": 12_000,
    "healthcare_cost_air_pollution_crores": 8_500,
    "noise_related_health_issues_annual": 450_000,
    "road_accident_fatalities_annual": 1_650,
    "road_accident_injuries_annual": 12_000,
    "two_wheeler_fatality_share_percent": 40,
    "year": 2025,
    "source": "Delhi Health Department (approximated)",
}

DELHI_EV_DOMAIN = {
    "domain": "delhi_ev_traffic",
    "city_name": "Delhi",
    "description": "Delhi NCR — EV adoption, traffic, and environmental data",
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
