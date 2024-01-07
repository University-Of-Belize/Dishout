import { Request, Response } from "express";
import { list_object } from "../../utility/batchRequest";
import Product from "../../../database/models/Products";
import ProductResearch from "../../../database/models/research/ProductData";
import what from "../../utility/Whats";
import { ErrorFormat, iwe_strings } from "../../strings";
import { what_is } from "../../utility/What_Is";
import mongoose from "mongoose";

async function menu_find(req: Request, res: Response) {
  // We can also search by ID
  const id = req.query.product_id;
  const slug = req.query.slug;
  let menu;

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    menu = await Product.findById(id);
    if (!menu) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
  } else {
    menu = await Product.findOne({ slug });
    if (!menu) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
  }

  // Menu will always be defined beyond this point
  // @ts-ignore
  await menu.populate([
    {
      path: "category",
      model: "Categories",
    },
    {
      path: "reviews",
      populate: {
        path: "reviewer",
        model: "Users",
      },
    },
  ]);

  // @ts-ignore
  return res.json(what_is(what.public.menu, menu));
}

async function menu_list(req: Request, res: Response) {
  await list_object(req, res, Product, what.public.menu, true, false, [
    {
      path: "category",
      model: "Categories",
    },
  ]);
}

async function slug_exists(req: Request, res: Response) {
  const slug = req.query.id;
  try {
    const product = await Product.findOne({ slug });
    if (product) {
      // Data to track
      let productresearch = await ProductResearch.findOne({ product });
      if (!productresearch) {
        productresearch = await ProductResearch.create({ product });
      }
      productresearch.views += 1;
      await productresearch.save();
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

    const menu = await Product.find()
      .populate([
        {
          path: "category",
          model: "Categories",
        },
        {
          path: "reviews",
          populate: {
            path: "reviewer",
            model: "Users",
          },
        },
      ])
      .skip(random)
      .limit(limit)
      .exec();

    res.json(what_is(what.public.menu, menu));
  } catch (err) {
    res.status(500).send(err);
  }
}

async function menu_random_internal(limit: number) {
  try {
    if (isNaN(limit)) {
      limit = 1;
    }

    const count = await Product.countDocuments();
    const random = Math.floor(Math.random() * count);

    const menu = await Product.find()
      .populate([
        {
          path: "category",
          model: "Categories",
        },
        {
          path: "reviews",
          populate: {
            path: "reviewer",
            model: "Users",
          },
        },
      ])
      .skip(random)
      .limit(limit)
      .exec();

    return what_is(what.public.menu, menu);
  } catch (err) {
    return what_is(what.public.menu, null);
  }
}

export { menu_find, menu_list, slug_exists, menu_random, menu_random_internal };
