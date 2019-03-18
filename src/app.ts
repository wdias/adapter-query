import { Request, Response } from "express";
import { MongoClient, Db, MongoError } from "mongodb";

import express from "express";
import compression from "compression";  // compresses requests
import expressValidator from "express-validator";
import bodyParser from "body-parser";
import { Metadata, metadataDecoder } from './types';
import { Polygon, GeoJsonObject } from "geojson";

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
  try {
    await db.collection('parameters').insertOne({
      locationId: 'zeroId',
      parameter: {
        parameterId: 'O.Precipitation',
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

app.post('/index/:timeseriesId', async (req: Request, res: Response) => {
  try {
    const timeseriesId: string = req.params.timeseriesId;
    console.log('/index timeseriesId: ', timeseriesId);
    const data: JSON = req.body;
    const metadata: Metadata = metadataDecoder.runWithException(data);
    try {
      await db.collection('locations').insertOne({
        location: { type: "Point", coordinates: [metadata.location.lon, metadata.location.lat] },
        name: metadata.location.name,
        locationId: metadata.location.locationId,
        category: "Location"
      });
      await db.collection('parameters').insertOne({
        locationId: metadata.location.locationId,
        parameter: metadata.parameter,
      });
    } catch (error) {
      if (error instanceof MongoError) {
        return res.status(204).send({ errmsg: error.errmsg });
      } else {
        throw error;
      }
    }
    return res.send(JSON.stringify(metadata));
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
    const metadata: Metadata = metadataDecoder.runWithException(data);
    await db.collection('locations').insertOne({
      loc: { type: "Point", coordinates: [metadata.location.lon, metadata.location.lat] },
      name: metadata.location.name,
      category: "Location"
    });
    res.send(JSON.stringify(metadata));
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.get('/public/hc', (req: Request, res: Response) => {
  console.log('Query Health Check 1');
  res.send('OK');
});

export default app;
