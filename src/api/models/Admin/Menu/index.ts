// Import our proper types
import { Request, Response } from "express";
// Import the promotion
import Menu from "../../../../database/models/Products";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import what from "../../../utility/Whats";
import { wis_array } from "../../../utility/What_Is";
import { delete_object } from "../../../utility/batchRequest";
import mongoose from "mongoose";

async function menu_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.menu) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // Extract information from the 'what_is' object
  const [category, slug, productName, description, image, price, in_stock] =
    wis_array(req);

  // verify
  const testFailed = check_values(
    res,
    slug,
    productName,
    price,
    image,
    in_stock,
    description,
    category
  );

  if (testFailed) return;

  // create the menu
  const newMenu = await Menu.create({
    slug: slug,
    productName: productName,
    price: price,
    // image: image,
    in_stock: in_stock,
    // description: description,  // @ts-ignore
    category: category,
  });

  if (image && image != null) {
    newMenu.image = image;
  }
  if (description && description != null) {
    newMenu.description = description;
  }

  await newMenu.save();
  return res.json({
    status: true,
  });
}

// delete menu
async function menu_delete(req: Request, res: Response) {
  await delete_object(
    req,
    res,
    Menu,
    "slug",
    what.public.menu,
    iwe_strings.Product.ENOTFOUND
  );
}

// modify menu
async function menu_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.public.menu) {
    // Two underscores means it's an admin function
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // extract fields to update
  const [category, slug, productName, description, image, price, in_stock] =
    wis_array(req);

  // verify
  const testFailed = check_values(
    res,
    slug,
    productName,
    price,
    image,
    in_stock,
    description,
    category
  );

  if (testFailed) return;

  // find menu by the slug
  const menu = await Menu.findOne({ slug: slug });
  if (!menu) {
    return res.status(404).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }

  // update menu fields
  if (slug) {
    menu.slug = slug;
  }
  if (productName) {
    menu.productName = productName;
  }
  if (price) {
    menu.price = price;
  }
  if (image) {
    menu.image = image;
  }
  if (in_stock) {
    menu.in_stock = in_stock;
  }
  if (description) {
    menu.description = description;
  }
  if (category) {
    menu.description = category;
  }

  await menu.save();

  return res.json({
    status: true,
  });
}

function check_values(
  res: Response,
  slug: string,
  productName: string,
  price: number,
  image: string,
  in_stock: number,
  description: string,
  category: string
) {
  if (
    !slug ||
    typeof slug != "string" ||
    !productName ||
    typeof productName != "string" ||
    !price ||
    typeof price != "number" ||
    typeof image != "string" ||
    !in_stock ||
    typeof in_stock != "number" ||
    typeof description != "string" ||
    !category ||
    typeof category != "string" ||
    !mongoose.Types.ObjectId.isValid(category)
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0;
}

export { menu_create, menu_delete, menu_modify };
