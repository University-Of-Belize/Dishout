// Import our proper types
import { Request, Response } from "express";
// Import the promotion
import Menu from "../../../../database/models/Products";
import Reviews from "../../../../database/models/Reviews";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import what from "../../../utility/Whats";
import { what_is, wis_array } from "../../../utility/What_Is";
import { delete_object } from "../../../utility/batchRequest";
import settings from "../../../../config/settings.json";
import mongoose from "mongoose";

// Create a new product
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

  // Check if a document with the same slug or product name already exists
  const existingMenu = await Menu.findOne({ $or: [{ slug }, { productName }] });
  if (existingMenu) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.EEXISTS));
  }

  // There are some reserved slugs that we can't use
  if (settings.products["disallowed-product-names"].includes(slug)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ERESERVEDSLUG));
  }

  // create the menu
  const newMenu = await Menu.create({
    slug: slug,
    productName: productName,
    price: price,
    // image: image,
    in_stock: in_stock,
    // description: description,
    category: category,
  });

  if (image) {
    newMenu.image = image;
  }
  if (description) {
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
    what.private.menu,
    iwe_strings.Product.ENOTFOUND,
    true,
    Reviews,
    "product"
  );
}

// modify menu
async function menu_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.menu) {
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
  const [
    old_slug,
    category,
    slug,
    productName,
    description,
    image,
    price,
    in_stock,
  ] = wis_array(req);

  // verify
  const testFailed = check_values(
    res,
    slug,
    productName,
    price,
    image,
    in_stock,
    description,
    category,
    old_slug
  );

  if (testFailed) return;

  // find menu by the slug
  const menu = await Menu.findOne({ slug: old_slug });
  if (!menu) {
    return res.status(404).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }

  // There are some reserved slugs that we can't use
  if (settings.products["disallowed-product-names"].includes(slug)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ERESERVEDSLUG));
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
    menu.category = category;
  }

  await menu.save();

  return res.json(
    what_is(what.private.menu, [iwe_strings.Order.IPMODIFY, menu])
  );
}

function check_values(
  res: Response,
  slug: string,
  productName: string,
  price: number,
  image: string,
  in_stock: number,
  description: string,
  category: string,
  old_slug?: string
) {
  if (
    (old_slug && typeof old_slug != "string") ||
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
