"""
Bangalore EV/Traffic Domain — Seed Data for Knowledge Graph.

Contains realistic data points based on publicly available statistics about
Bangalore's transportation ecosystem, used to ground AI predictions in facts.
"""

VEHICLE_REGISTRATIONS = {
    "total_registered_vehicles": 11_200_000,
    "breakdown": {
        "two_wheelers": {
            "total": 7_600_000,
            "petrol": 7_300_000,
            "electric": 300_000,
            "percentage_of_total": 67.9,
        },
        "four_wheelers": {
            "total": 2_500_000,
            "petrol": 1_500_000,
            "diesel": 800_000,
            "cng": 30_000,
            "electric": 170_000,
            "percentage_of_total": 22.3,
        },
        "auto_rickshaws": {
            "total": 450_000,
            "petrol": 180_000,
            "diesel": 20_000,
            "cng": 200_000,
            "electric": 50_000,
            "percentage_of_total": 4.0,
        },
        "buses": {
            "total": 10_000,
            "diesel": 7_500,
            "cng": 1_000,
            "electric": 1_500,
            "percentage_of_total": 0.1,
        },
        "commercial_vehicles": {
            "total": 650_000,
            "diesel": 580_000,
            "petrol": 45_000,
            "electric": 25_000,
            "percentage_of_total": 5.8,
        },
    },
    "annual_new_registrations": 780_000,
    "ev_growth_rate_yoy_percent": 60,
    "year": 2025,
    "source": "Karnataka Transport Department (approximated)",
}

AIR_QUALITY = {
    "annual_average_aqi": 118,
    "aqi_category": "Moderate",
    "pm25_annual_avg_ugm3": 42.1,
    "pm10_annual_avg_ugm3": 82.5,
    "no2_annual_avg_ugm3": 38.6,
    "co_annual_avg_mgm3": 1.5,
    "vehicular_emission_share_percent": 44,
    "two_wheeler_emission_share_of_vehicular_percent": 35,
    "industrial_emission_share_percent": 20,
    "construction_emission_share_percent": 22,
    "other_emission_share_percent": 14,
    "monitoring_stations": [
        {"name": "Silk Board", "avg_aqi": 145},
        {"name": "Peenya", "avg_aqi": 132},
        {"name": "BTM Layout", "avg_aqi": 122},
        {"name": "Hebbal", "avg_aqi": 108},
        {"name": "Jayanagar", "avg_aqi": 98},
        {"name": "Whitefield", "avg_aqi": 115},
    ],
    "year": 2025,
    "source": "CPCB / KSPCB (approximated)",
}

EV_INFRASTRUCTURE = {
    "public_charging_stations": 2_200,
    "fast_charging_stations": 580,
    "battery_swapping_stations": 220,
    "home_charging_penetration_percent": 70,
    "average_charging_time_hours": {
        "slow_ac": 8,
        "fast_dc": 1.5,
        "ultra_fast": 0.5,
    },
    "grid_capacity_for_ev_percent": 78,
    "renewable_energy_in_grid_percent": 42,
    "planned_stations_by_2030": 20_000,
    "investment_in_infrastructure_crores": 3_800,
    "year": 2025,
    "source": "BESCOM / Karnataka Govt (approximated)",
}

TRAFFIC_DATA = {
    "daily_trips_millions": 16.5,
    "average_commute_time_minutes": 52,
    "peak_hour_speed_kmph": 12,
    "off_peak_speed_kmph": 30,
    "two_wheeler_mode_share_percent": 48,
    "four_wheeler_mode_share_percent": 20,
    "public_transport_mode_share_percent": 15,
    "auto_rickshaw_mode_share_percent": 10,
    "walking_cycling_mode_share_percent": 7,
    "road_network_km": 14_000,
    "metro_route_km": 73.8,
    "metro_daily_ridership": 650_000,
    "bmtc_daily_ridership": 3_500_000,
    "traffic_congestion_cost_crores_annual": 22_000,
    "road_accidents_annual": 4_800,
    "two_wheeler_accident_share_percent": 45,
    "year": 2025,
    "source": "Bangalore Traffic Police / BMRCL (approximated)",
}

ECONOMIC_DATA = {
    "auto_sector_employment": {
        "total_jobs": 260_000,
        "dealerships_service_petrol": 10_500,
        "fuel_stations": 2_800,
        "fuel_station_employees": 24_000,
        "mechanics_workshops": 16_000,
        "auto_parts_retail": 7_500,
        "ev_ecosystem_jobs": 25_000,
    },
    "fuel_economy": {
        "daily_petrol_consumption_kilolitres": 3_800,
        "daily_diesel_consumption_kilolitres": 3_200,
        "petrol_price_per_litre": 101.94,
        "diesel_price_per_litre": 87.89,
        "annual_fuel_revenue_crores": 28_000,
        "fuel_tax_revenue_state_crores": 9_200,
        "fuel_tax_revenue_central_crores": 10_500,
    },
    "ev_market": {
        "average_electric_two_wheeler_price": 130_000,
        "average_petrol_two_wheeler_price": 88_000,
        "ev_subsidy_per_vehicle": 15_000,
        "annual_ev_market_size_crores": 4_800,
        "ev_battery_cost_trend_yoy_decline_percent": 13,
    },
    "gdp_contribution_transport_percent": 7.5,
    "year": 2025,
    "source": "RBI / Karnataka Economic Survey (approximated)",
}

ENVIRONMENTAL_FACTORS = {
    "carbon_emissions": {
        "total_transport_co2_tonnes_annual": 7_200_000,
        "per_petrol_two_wheeler_kg_annual": 380,
        "per_diesel_car_kg_annual": 2_600,
        "per_petrol_car_kg_annual": 1_950,
        "per_ev_two_wheeler_kg_annual": 65,
        "per_ev_car_kg_annual": 380,
    },
    "noise_pollution": {
        "average_db_peak_hours": 80,
        "two_wheeler_contribution_percent": 38,
        "safe_threshold_db": 70,
    },
    "green_cover": {
        "total_green_cover_percent": 17.5,
        "target_green_cover_percent": 33,
        "road_space_percent_of_city": 11,
    },
    "year": 2025,
    "source": "Karnataka Forest Department / CPCB (approximated)",
}

HEALTH_DATA = {
    "respiratory_diseases_annual_cases": 1_500_000,
    "air_pollution_attributed_deaths_annual": 3_500,
    "healthcare_cost_air_pollution_crores": 2_800,
    "noise_related_health_issues_annual": 220_000,
    "road_accident_fatalities_annual": 950,
    "road_accident_injuries_annual": 7_200,
    "two_wheeler_fatality_share_percent": 48,
    "year": 2025,
    "source": "Karnataka Health Department (approximated)",
}

BANGALORE_EV_DOMAIN = {
    "domain": "bangalore_ev_traffic",
    "city_name": "Bangalore",
    "description": "Bangalore metropolitan area — EV adoption, traffic, and environmental data",
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
