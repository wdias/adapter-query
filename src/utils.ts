import { Db, MongoError, ObjectID } from "mongodb";

export const initLocations = async (db: Db) => {
    try {
        await db.collection('locations').insertOne({
            location: { type: "Point", coordinates: [0.0, 0.0] },
            name: 'Zero',
            locationId: 'zeroId',
            category: "Location"
        });
    } catch (error) {
        if (!(error instanceof MongoError)) {
            throw error;
        }
    }
    db.collection('locations').createIndex({ location: "2dsphere" });
    db.collection('locations').createIndex({ locationId: 1 }, { unique: true });
}

export const initParameters = async (db: Db) => {
    try {
        await db.collection('parameters').insertOne({
            locationId: 'zeroId',
            parameter: {
                parameterId: 'parameterId',
                variable: 'Precipitation',
                unit: 'mm',
                parameterType: 'Instantaneous'
            }
        });
    } catch (error) {
        if (!(error instanceof MongoError)) {
            throw error;
        }
    }
    db.collection('parameters').createIndex({ "locationId": 1, "parameter.parameterId": 1 }, { unique: true });
}

export const initTimeseries = async (db: Db) => {
    try {
        await db.collection('timeseries').insertOne({
            timeseriesId: "0000000000000000000000000000000000000000000000000000000000000000",
            moduleId: "moduleId",
            valueType: "Scalar",
            parameter: {
                parameterId: "parameterId",
                variable: "Precipitation",
                unit: "mm",
                parameterType: "Instantaneous"
            },
            location: {
                locationId: "locationId",
                name: "Name",
                lat: 0.0,
                lon: 0.0
            },
            timeseriesType: "ExternalHistorical",
            timeStep: {
                timeStepId: "timeStepId",
                unit: "Second",
                multiplier: 0
            },
        });
    } catch (error) {
        if (!(error instanceof MongoError)) {
            throw error;
        }
    }
    db.collection('timeseries').createIndex({ "timeseriesId": 1 }, { unique: true });
    db.collection('timeseries').createIndex({ "location.locationId": 1, "parameter.parameterId": 1 });
}
