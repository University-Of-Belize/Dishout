import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Product from "../../../database/models/Products";
import what from "../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../strings";
import { what_is } from "../../utility/What_Is";

async function menu_list(req: Request, res: Response) {
  await list_object(req, res, Product, what.public.menu, true, false);
}

async function slug_exists(req: Request, res: Response) {
  const slug = req.query.id;
  try {
    const product = await Product.findOne({ slug });
    if (product) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    res.status(500).send(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }
}

async function menu_random(req: Request, res: Response) {
  try {
    let limit = req.query.page ? parseInt(req.query.page as string) : 1;
    if (isNaN(limit)) {
      limit = 1;
    }
    
    const count = await Product.countDocuments();
    const random = Math.floor(Math.random() * count);

    const menu = await Product.find().skip(random).limit(limit).exec();

    res.json(what_is(what.public.menu, menu));
  } catch (err) {
    res.status(500).send(err);
  }
}


export { menu_list, slug_exists, menu_random };
