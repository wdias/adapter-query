import { Request, Response } from "express";
import { MongoClient, Db } from "mongodb";

import express from "express";
import compression from "compression";  // compresses requests
import expressValidator from "express-validator";
import bodyParser from "body-parser";
import { Metadata, metadataDecoder } from './types';

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
  db.collection('locations').createIndex({ loc: "2dsphere" });
}

app.post('/index/:timeseriesId', async (req: Request, res: Response) => {
  try {
    const timeseriesId: string = req.params.timeseriesId;
    console.log('timeseriesId: ', req.params.timeseriesId);
    const data: JSON = req.body;
    const metadata: Metadata = metadataDecoder.runWithException(data);
    await db.collection('locations').insertOne(
      {
        loc: { type: "Point", coordinates: [-73.97, 40.77] },
        name: "Central Park",
        category: "Parks"
      }
    )
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
