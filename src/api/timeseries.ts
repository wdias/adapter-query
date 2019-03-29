import express, { Router, Request, Response } from "express";
import { Db } from "mongodb";
import { getDb } from "../utils";

const router: Router = express.Router();
let db: Db = getDb();

router.post('/timeseries', async (req: Request, res: Response) => {
    try {
        res.send('OK');
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

export default router;
