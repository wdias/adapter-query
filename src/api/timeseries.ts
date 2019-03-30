import express, { Router, Request, Response } from "express";
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Metadata, metadataDecoder } from "../types";
import { MetadataIdsQuery, metadataIdsQueryDecoder } from "../types/query";
import { getDb as db } from "../utils";
import { indexTimeseries } from "../app";
import { isDecoderError } from "@mojotech/json-type-validation";

const router: Router = express.Router();
const adapterMetadata = 'http://adapter-metadata.default.svc.cluster.local';
const clientMetadata: AxiosInstance = axios.create({
    baseURL: adapterMetadata,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

router.post('/timeseries', async (req: Request, res: Response) => {
    try {
        const data: JSON = req.body;
        console.log('/metadata/timeseries data:', data);
        const mq: MetadataIdsQuery = metadataIdsQueryDecoder.runWithException(data);
        const parameterId: string = mq.parameterId || (mq.parameter ? mq.parameter.parameterId : '');
        const locationId: string = mq.locationId || (mq.location ? mq.location.locationId : '');
        const timeStepId: string = mq.timeStepId || (mq.timeStep ? mq.timeStep.timeStepId : '');
        const timeseries = await db().collection('timeseries').findOne({
            "moduleId": mq.moduleId, "valueType": mq.valueType,
            "parameter.parameterId": parameterId, "location.locationId": locationId,
            "timeseriesType": mq.timeseriesType, "timeStep.timeStepId": timeStepId
        });
        if (timeseries) {
            res.send(timeseries);
        } else {
            const resp: AxiosResponse = await clientMetadata.post('/timeseries', data);
            const metadata: Metadata = metadataDecoder.runWithException(resp.data);
            if ('timeseriesId' in resp.data) {
                const msg: string[] = await indexTimeseries(resp.data['timeseriesId'], metadata);
                console.info(msg);
                res.send(metadata);
            } else {
                res.status(400).send('Unable to create timeseries. Try again.');
            }
        }
    } catch (e) {
        console.error(e);
        if (isDecoderError(e)) {
            res.status(400).send(e.toString());
        } else {
            res.status(500).send(e.toString());
        }
    }
});

export default router;
