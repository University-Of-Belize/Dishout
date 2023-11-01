import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Order from "../../../database/models/Orders";
import what from "../../utility/Whats";

async function order_list(req: Request, res: Response) {
  await list_object(req, res, Order, what.public.order, true, false);
}

function order_create(req: Express.Request, res: Express.Response){}
function order_delete(req: Express.Request, res: Express.Response){}
function order_modify(req: Express.Request, res: Express.Response){}
export { order_list, order_create, order_delete, order_modify };
