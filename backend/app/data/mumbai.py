"""
Mumbai EV/Traffic Domain — Seed Data for Knowledge Graph.

Contains realistic data points based on publicly available statistics about
Mumbai's transportation ecosystem, used to ground AI predictions in facts.
"""

VEHICLE_REGISTRATIONS = {
    "total_registered_vehicles": 10_800_000,
    "breakdown": {
        "two_wheelers": {
            "total": 5_800_000,
            "petrol": 5_550_000,
            "electric": 250_000,
            "percentage_of_total": 53.7,
        },
        "four_wheelers": {
            "total": 3_200_000,
            "petrol": 1_600_000,
            "diesel": 1_200_000,
            "cng": 300_000,
            "electric": 100_000,
            "percentage_of_total": 29.6,
        },
        "auto_rickshaws": {
            "total": 850_000,
            "petrol": 100_000,
            "diesel": 50_000,
            "cng": 650_000,
            "electric": 50_000,
            "percentage_of_total": 7.9,
        },
        "buses": {
            "total": 8_500,
            "diesel": 4_500,
            "cng": 2_500,
            "electric": 1_500,
            "percentage_of_total": 0.1,
        },
        "commercial_vehicles": {
            "total": 950_000,
            "diesel": 850_000,
            "petrol": 70_000,
            "electric": 30_000,
            "percentage_of_total": 8.8,
        },
    },
    "annual_new_registrations": 700_000,
    "ev_growth_rate_yoy_percent": 42,
    "year": 2025,
    "source": "Maharashtra Transport Department (approximated)",
}

AIR_QUALITY = {
    "annual_average_aqi": 155,
    "aqi_category": "Unhealthy",
    "pm25_annual_avg_ugm3": 62.3,
    "pm10_annual_avg_ugm3": 110.5,
    "no2_annual_avg_ugm3": 48.1,
    "co_annual_avg_mgm3": 2.1,
    "vehicular_emission_share_percent": 30,
    "two_wheeler_emission_share_of_vehicular_percent": 25,
    "industrial_emission_share_percent": 35,
    "construction_emission_share_percent": 20,
    "other_emission_share_percent": 15,
    "monitoring_stations": [
        {"name": "Bandra Kurla", "avg_aqi": 168},
        {"name": "Worli", "avg_aqi": 152},
        {"name": "Andheri", "avg_aqi": 162},
        {"name": "Chembur", "avg_aqi": 175},
        {"name": "Colaba", "avg_aqi": 130},
        {"name": "Borivali", "avg_aqi": 145},
    ],
    "year": 2025,
    "source": "CPCB / MPCB (approximated)",
}

EV_INFRASTRUCTURE = {
    "public_charging_stations": 1_500,
    "fast_charging_stations": 380,
    "battery_swapping_stations": 200,
    "home_charging_penetration_percent": 45,
    "average_charging_time_hours": {
        "slow_ac": 8,
        "fast_dc": 1.5,
        "ultra_fast": 0.5,
    },
    "grid_capacity_for_ev_percent": 60,
    "renewable_energy_in_grid_percent": 20,
    "planned_stations_by_2030": 12_000,
    "investment_in_infrastructure_crores": 3_200,
    "year": 2025,
    "source": "Mumbai Municipal / Ministry of Power (approximated)",
}

TRAFFIC_DATA = {
    "daily_trips_millions": 22.0,
    "average_commute_time_minutes": 65,
    "peak_hour_speed_kmph": 10,
    "off_peak_speed_kmph": 25,
    "two_wheeler_mode_share_percent": 30,
    "four_wheeler_mode_share_percent": 18,
    "public_transport_mode_share_percent": 38,
    "auto_rickshaw_mode_share_percent": 8,
    "walking_cycling_mode_share_percent": 6,
    "road_network_km": 2_000,
    "metro_route_km": 46.5,
    "metro_daily_ridership": 450_000,
    "best_daily_ridership": 7_500_000,
    "traffic_congestion_cost_crores_annual": 35_000,
    "road_accidents_annual": 3_100,
    "two_wheeler_accident_share_percent": 35,
    "year": 2025,
    "source": "Mumbai Traffic Police / MMRDA (approximated)",
}

ECONOMIC_DATA = {
    "auto_sector_employment": {
        "total_jobs": 320_000,
        "dealerships_service_petrol": 14_000,
        "fuel_stations": 3_500,
        "fuel_station_employees": 32_000,
        "mechanics_workshops": 20_000,
        "auto_parts_retail": 9_500,
        "ev_ecosystem_jobs": 18_000,
    },
    "fuel_economy": {
        "daily_petrol_consumption_kilolitres": 4_800,
        "daily_diesel_consumption_kilolitres": 4_500,
        "petrol_price_per_litre": 103.44,
        "diesel_price_per_litre": 89.97,
        "annual_fuel_revenue_crores": 42_000,
        "fuel_tax_revenue_state_crores": 11_000,
        "fuel_tax_revenue_central_crores": 15_000,
    },
    "ev_market": {
        "average_electric_two_wheeler_price": 128_000,
        "average_petrol_two_wheeler_price": 86_000,
        "ev_subsidy_per_vehicle": 10_000,
        "annual_ev_market_size_crores": 3_500,
        "ev_battery_cost_trend_yoy_decline_percent": 11,
    },
    "gdp_contribution_transport_percent": 8.0,
    "year": 2025,
    "source": "RBI / Maharashtra Economic Survey (approximated)",
}

ENVIRONMENTAL_FACTORS = {
    "carbon_emissions": {
        "total_transport_co2_tonnes_annual": 9_800_000,
        "per_petrol_two_wheeler_kg_annual": 410,
        "per_diesel_car_kg_annual": 2_750,
        "per_petrol_car_kg_annual": 2_050,
        "per_ev_two_wheeler_kg_annual": 90,
        "per_ev_car_kg_annual": 500,
    },
    "noise_pollution": {
        "average_db_peak_hours": 84,
        "two_wheeler_contribution_percent": 28,
        "safe_threshold_db": 70,
    },
    "green_cover": {
        "total_green_cover_percent": 13.0,
        "target_green_cover_percent": 33,
        "road_space_percent_of_city": 8,
    },
    "year": 2025,
    "source": "Maharashtra Forest Department / CPCB (approximated)",
}

HEALTH_DATA = {
    "respiratory_diseases_annual_cases": 2_400_000,
    "air_pollution_attributed_deaths_annual": 8_000,
    "healthcare_cost_air_pollution_crores": 5_800,
    "noise_related_health_issues_annual": 380_000,
    "road_accident_fatalities_annual": 800,
    "road_accident_injuries_annual": 6_800,
    "two_wheeler_fatality_share_percent": 38,
    "year": 2025,
    "source": "Maharashtra Health Department (approximated)",
}

MUMBAI_EV_DOMAIN = {
    "domain": "mumbai_ev_traffic",
    "city_name": "Mumbai",
    "description": "Mumbai metropolitan area — EV adoption, traffic, and environmental data",
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
