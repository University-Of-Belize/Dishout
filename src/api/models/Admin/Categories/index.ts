import { Request, Response } from "express";
import Category from "../../../../database/models/Categories";
import what from "../../../utility/Whats";
import { what_is, wis_array } from "../../../utility/What_Is";
import { get_authorization_user } from "../../../utility/Authentication";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { delete_object } from "../../../utility/batchRequest";

async function category_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.category) {
    // Two underscores means it's an admin function
    return res.status(418).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
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

  // Extract the category name from the request body
  const [categoryName, description, alias, hidden] = wis_array(req);
  let alias_: string | undefined = alias;
  if (alias == null) alias_ = undefined;

  // Check if categoryName corresponds to an existing Category
  const category = await Category.findOne({
    $or: [{ name: categoryName }, { alias: alias_ }],
  });
  if (category) {
    return res.status(400).json(ErrorFormat(iwe_strings.Category.EEXISTS));
  }

  // Check if categoryName is a string
  const testFailed = check_values(
    res,
    categoryName,
    undefined,
    description,
    alias,
    hidden
  );
  if (testFailed) return;

  // Create a new category
  const newCategory = await Category.create({
    name: categoryName,
    description,
    alias: alias ?? undefined,
    hidden: hidden ?? false,
  });

  // Return the new category as a JSON response
  return res.json(what_is(what.public.category, newCategory));
}
async function category_delete(req: Request, res: Response) {
  await delete_object(
    req,
    res,
    Category,
    "name",
    what.private.category,
    iwe_strings.Category.ENOTFOUND,
    true
  );
}

async function category_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.category) {
    // Two underscores means it's an admin function
    return res.status(418).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
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

  // Extract the category id and new name from the request body
  const [name, newname, description, alias, hidden] = wis_array(req);
  let alias_: string | undefined = alias;
  if (alias == null) alias_ = undefined;

  const testFailed = check_values(
    res,
    name,
    newname,
    description,
    alias,
    hidden
  );
  if (testFailed) return;

  // Find the category by its ID
  const category = await Category.findOne({ name });
  if (!category) {
    return res.status(404).json(ErrorFormat(iwe_strings.Category.ENOTFOUND));
  }
  // Find dupes with the same alias OR name
  const category_dupe = await Category.findOne({
    $or: [{ name }, { alias: name }],
  });
  if (category_dupe) {
    return res.status(400).json(ErrorFormat(iwe_strings.Category.EEXISTS));
  }

  // Update the category's name
  if (name) {
    category.name = newname;
  }
  if (description) {
    category.description = description;
  }
  if (alias) {
    category.alias = alias_;
  }
  if (hidden) {
    category.hidden = hidden;
  }
  // Save the updated category
  await category.save();

  // Return the updated category as a JSON response
  return res.json(what_is(what.public.category, category));
}

function check_values(
  res: Response,
  categoryName: string,
  newname: string | undefined,
  description: string,
  alias: string,
  hidden: boolean
) {
  // Check if categoryName is a string
  if (!categoryName || typeof categoryName !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (newname && typeof categoryName !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (!description || typeof description !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (alias && typeof alias !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (hidden && typeof hidden !== "boolean") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  return 0; // no errors
}

export { category_create, category_delete, category_modify };
