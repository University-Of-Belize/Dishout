import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Product from "../../../database/models/Products";
import what from "../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../strings";

async function menu_list(req: Request, res: Response) {
  await list_object(req, res, Product, what.public.menu, true, false);
}

async function slug_exists(req: Request, res: Response) {
  const slug = req.params.id;

  try {
    const product = await Product.findOne({ slug });
    if (product) {
      res.status(200);
    } else {
      res.status(404);
    }
  } catch (err) {
    res.status(500).send(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }
}

export { menu_list, slug_exists };
