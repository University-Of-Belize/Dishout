// Tired of writing the same code each time. This file is a generalization
import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";
import { wis_string, what_is } from "./What_Is";
import { get_authorization_user } from "./Authentication";
import { ErrorFormat, iwe_strings } from "../strings";

// Object deletion
async function __data_table_trigger_delete(
  req: Request,
  res: Response,
  Model: Model<any>,
  field: string,
  whats: string,
  ENOTFOUND: string
) {
  // Check our 'what_is'
  if (req.body["what"] != whats) {
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

  // Extract the promotion ID from the request body
  const objectId = wis_string(req);
  // Check if objectId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  let query = `{ "${field}": "${objectId}" }`; // Hack-ish
  let object;
  // Find the promotion by ID and delete it
  try {
    object = await Model.findOne(JSON.parse(query));
  } catch (error) {
    // console.log(error);
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }
  if (!object) {
    return res.status(404).json(ErrorFormat(ENOTFOUND));
  }

  object.deleteOne();
  return res.json({
    status: true,
  });
}

// Object retrieval
async function __data_table_trigger_list(
  req: Request,
  res: Response,
  Model: Model<any>,
  whats: string
) {
  // We don't need a body since we're doing the 'what_is' this time

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

  // Get all promotions from the database
  const object = await Model.find();

  // Return the promotions as a JSON response
  return res.json(what_is(whats, object));
}

export {
  __data_table_trigger_delete as delete_object,
  __data_table_trigger_list as list_object,
};
