import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Category from "../../../database/models/Categories";
import what from "../../utility/Whats";

async function category_list(req: Request, res: Response) {
  await list_object(req, res, Category, what.public.category, true, false);
}

export { category_list };
