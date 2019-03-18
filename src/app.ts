import { Request, Response } from "express";
import { MongoClient, Db, MongoError, InsertOneWriteOpResult } from "mongodb";

import express from "express";
import compression from "compression";  // compresses requests
import expressValidator from "express-validator";
import bodyParser from "body-parser";
import { Polygon, GeoJsonObject } from "geojson";
import { Metadata, metadataDecoder } from './types';
import { timeseriesQueryDecoder, TimeseriesQuery } from "./types/query";
import { initLocations, initParameters, initTimeseries } from "./utils";

// Create Express server
const app = express();
let db: Db;

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

export const initDatabase = async () => {
  const mongodbSVC: string = 'adapter-query-mongodb.default.svc.cluster.local'
  const client: MongoClient = await MongoClient.connect(`mongodb://root:root123@${mongodbSVC}:27017/?authSource=admin`, { useNewUrlParser: true });
  db = client.db('query');
  initLocations(db);
  initParameters(db);
  initTimeseries(db);
}

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

app.post('/index/:timeseriesId', async (req: Request, res: Response) => {
  try {
    const timeseriesId: string = req.params.timeseriesId;
    console.log('/index timeseriesId: ', timeseriesId);
    const data: JSON = req.body;
    const metadata: Metadata = metadataDecoder.runWithException(data);
    let msg: string[] = [];
    const resLocations: string = await insertOnewithFail(db, 'locations', {
      location: { type: "Point", coordinates: [metadata.location.lon, metadata.location.lat] },
      name: metadata.location.name,
      locationId: metadata.location.locationId,
      category: "Location"
    });
    const resParamters: string = await insertOnewithFail(db, 'parameters', {
      locationId: metadata.location.locationId,
      parameter: metadata.parameter,
    });
    const resTimeseries: string = await insertOnewithFail(db, 'timeseries', {
      timeseriesId: timeseriesId,
      ...data,
    });
    res.send([resLocations, resParamters, resTimeseries]);
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/location', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/location data: ', data);
    if ('type' in data) {
      const obj: GeoJsonObject = data;
      if (obj.type === 'Polygon') {
        const polygon: Polygon = data;
        const locations = await db.collection('locations').find({
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
      }
    } else {
      res.status(400).send('Should have be type of Polygon or Box - https://docs.mongodb.com/manual/reference/geojson/');
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/parameter', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/parameter data:', data);
    if (Array.isArray(data) && data.length) {
      const parameters = await db.collection('parameters').find({ locationId: { $in: data } }).toArray();
      res.send(parameters);
    } else {
      res.status(500).send('Should be an array of locationId');
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.post('/timeseries', async (req: Request, res: Response) => {
  try {
    const data: JSON = req.body;
    console.log('/timeseries data:', data);
    const query: TimeseriesQuery = timeseriesQueryDecoder.runWithException(data);
    if (query.location || query.locations) {
      const locations = query.locations || [query.location];
      const q = query.parameter ?
        { $and: [{ "location.locationId": { $in: locations } }, { "parameter.parameterId": { $eq: query.parameter } }] } :
        { "location.locationId": { $in: locations } }
      const timeseries = await db.collection('timeseries').find(q).toArray();
      res.send(timeseries);
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.get('/public/hc', (req: Request, res: Response) => {
  console.log('Query Health Check 1');
  res.send('OK');
});

export default app;
