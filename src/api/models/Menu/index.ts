import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Product from "../../../database/models/Products";
import what from "../../utility/Whats";

async function menu_list(req: Request, res: Response) {
  await list_object(req, res, Product, what.public.menu, true, false);
}

export { menu_list };
