from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    """
    Base model configuration that automatically handles camelCase serialization
    for frontend clients, while using pythonic snake_case internally.
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class SmartBusData(CamelModel):
    total: int
    running: int
    stopped: int
    halt: int
    not_polling: int

class StreetLightData(CamelModel):
    total: int
    on: int
    off: int
    dim1: int
    dim2: int

class CCTVData(CamelModel):
    total: int
    normal: int
    faulty: int
    no_feed: int
    no_recording: int

class ITMSData(CamelModel):
    total: int
    working: int
    faulty: int

class EnvironmentData(CamelModel):
    severe: int
    very_poor: int
    poor: int
    moderate: int
    satisfactory: int
    good: int

class ParkingData(CamelModel):
    total: int
    full: int
    not_occupied: int
    under25: int
    under50: int
    under75: int
    over75: int

class GarbageData(CamelModel):
    total: int
    full: int
    empty: int
    under25: int
    under50: int
    under75: int
    over75: int

class PowerData(CamelModel):
    total: int
    hi_tech_city: int
    kondapur: int
    raidurg: int

class WaterData(CamelModel):
    treatment_plants: int
    plant_efficiency: int
    drinking_water_quality: int
    avg_water_processed: int

class STPData(CamelModel):
    treatment_plants: int
    operational_capacity: int
    avg_sewage_processed: int
    operational_efficiency: int

class CityMetricsResponse(CamelModel):
    id: int
    timestamp: datetime
    smart_bus: SmartBusData
    street_light: StreetLightData
    cctv: CCTVData
    itms: ITMSData
    environment: EnvironmentData
    parking: ParkingData
    garbage: GarbageData
    power: PowerData
    water: WaterData
    stp: STPData
    livability_index: float
    drinking_water_index: float
    revenue_index: float
