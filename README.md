# adapter-queries
Adapter for Query Timeseries data microservice.

# Timeseries Query Support
- Location, Time → Timeseries
- Area → Locations
- Area, Time → Timeseries
- Area, Variable, Time → Timeseries
- Time → Timeseries (Compromise resources)
- \* → Locations
- *, Time → Timeseries
- *, * → Timeseries

Redefine:
/location
- \* → Locations
- Area → Locations
/parameter
- Location → Parameters
/timeseries
- Location → Timeseries
- Locations → Timeseries
- Area → Timeseries
- Area, Parameter → Timeseries
- *, Parameter → Timeseries
- \* → Timeseries
TODO (Time support: Get Timeseries on given time)
- Area, Time → Timeseries
- Area, Parameter, Time → Timeseries
- *, Time → Timeseries


Get Timeseries data by giving the location details via GeoJSON - http://geojson.io

# /location
POST with GeoJson objects
```json
{
    "type": "Polygon",
    "coordinates": [
        [
            [
                79.48471069335938,
                6.311203650047962
            ],
            [
                81.0516357421875,
                6.311203650047962
            ],
            [
                81.0516357421875,
                7.607552723017506
            ],
            [
                79.48471069335938,
                7.607552723017506
            ],
            [
                79.48471069335938,
                6.311203650047962
            ]
        ]
    ]
}
```

# /parameter
