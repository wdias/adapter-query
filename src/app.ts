import { Request, Response } from "express";
import { MongoClient, Db, MongoError, InsertOneWriteOpResult } from "mongodb";

import express from "express";
import compression from "compression";  // compresses requests
import expressValidator from "express-validator";
import bodyParser from "body-parser";
import { Polygon, GeoJsonObject } from "geojson";
import { Metadata, metadataDecoder } from './types';
import { timeseriesQueryDecoder, TimeseriesQuery } from "./types/query";
import { getDb as db } from "./utils";
import timeseries from './api/timeseries';

// Create Express server
const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

const insertOnewithFail = async (database: Db, collection: string, data: object): Promise<string> => {
  try {
    const result: InsertOneWriteOpResult = await database.collection(collection).insertOne(data);
    return `${collection}-${result.insertedId}`;
  } catch (error) {
    if (error instanceof MongoError) {
      return error.message;
    } else {
      throw error;
    }
  }
}

export const indexTimeseries = async (timeseriesId: string, metadata: Metadata): Promise<string[]> => {
  const resLocations: string = await insertOnewithFail(db(), 'locations', {
    location: { type: "Point", coordinates: [metadata.location.lon, metadata.location.lat] },
    name: metadata.location.name,
    locationId: metadata.location.locationId,
    category: "Location"
  });
  const resParamters: string = await insertOnewithFail(db(), 'parameters', {
    locationId: metadata.location.locationId,
    parameter: metadata.parameter,
  });
  const resTimeseries: string = await insertOnewithFail(db(), 'timeseries', {
    timeseriesId: timeseriesId,
    ...metadata,
  });
  return [resLocations, resParamters, resTimeseries];
}

app.post('/query/index/:timeseriesId', async (req: Request, res: Response) => {
  try {
    const timeseriesId: string = req.params.timeseriesId;
    console.log('/query/index timeseriesId: ', timeseriesId);
    const data: JSON = req.body;
    const metadata: Metadata = metadataDecoder.runWithException(data);
    const resp: string[] = await indexTimeseries(timeseriesId, metadata);
    res.send(resp);
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/query/location', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/query/location data: ', data);
    if ('type' in data) {
      const obj: GeoJsonObject = data;
      if (obj.type === 'Polygon') {
        const polygon: Polygon = data;
        const locations = await db().collection('locations').find({
          location: {
            $geoWithin: {
              $geometry: {
                type: "Polygon",
                coordinates: polygon.coordinates,
              }
            }
          }
        }).limit(1000).toArray();
        res.send(locations);
      } else {
        res.status(400).send('Should have be type of Polygon or Box - https://docs.mongodb.com/manual/reference/geojson/');
      }
    } else {
      const locations = await db().collection('locations').find({}).limit(1000).toArray();
      res.send(locations);
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/query/parameter', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/query/parameter data:', data);
    if (Array.isArray(data) && data.length) {
      const parameters = await db().collection('parameters').find({ locationId: { $in: data } }).toArray();
      res.send(parameters);
    } else {
      res.status(500).send('Should be an array of locationId');
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/query/timeseries', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/query/timeseries data:', data);
    const query: TimeseriesQuery = timeseriesQueryDecoder.runWithException(data);
    if (query.location || query.locations) {
      const locations = query.locations || [query.location];
      const q = query.parameter ?
        { $and: [{ "location.locationId": { $in: locations } }, { "parameter.parameterId": { $eq: query.parameter } }] } :
        { "location.locationId": { $in: locations } }
      const timeseries = await db().collection('timeseries').find(q).toArray();
      res.send(timeseries);
    } else if (query.geoJson) {
      const geoJsonData: JSON = JSON.parse(JSON.stringify(query.geoJson));
      if ('type' in geoJsonData) {
        const obj: GeoJsonObject = geoJsonData;
        if (obj.type === 'Polygon') {
          const polygon: Polygon = geoJsonData;
          const locations = await db().collection('locations').find({
            location: {
              $geoWithin: {
                $geometry: {
                  type: "Polygon",
                  coordinates: polygon.coordinates,
                }
              }
            }
          }).project({ locationId: 1 }).limit(1000).map(v => v.locationId).toArray();
          const q = query.parameter ?
            { $and: [{ "location.locationId": { $in: locations } }, { "parameter.parameterId": { $eq: query.parameter } }] } :
            { "location.locationId": { $in: locations } }
          const timeseries = await db().collection('timeseries').find(q).toArray();
          res.send(timeseries);
        }
      } else {
        res.status(400).send('Should have be type of Polygon or Box - https://docs.mongodb.com/manual/reference/geojson/');
      }
    } else {
      const q = query.parameter ?
        { "parameter.parameterId": { $eq: query.parameter } } : {}
      const timeseries = await db().collection('timeseries').find(q).toArray();
      res.send(timeseries);
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.get('/query/public/hc', (req: Request, res: Response) => {
  console.log('Query Health Check 1');
  res.send('OK');
});

app.use('/metadata', timeseries);

export default app;
