// Tired of writing the same code each time. This file is a generalization
import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";
import { ErrorFormat, iwe_strings } from "../strings";
import { get_authorization_user } from "./Authentication";
import { what_is, wis_string } from "./What_Is";

// Object deletion
/**
 * @brief Delete a document in the database effectively.
 * @param req Express Request
 * @param res Express Response
 * @param Model Mongoose Model
 * @param field field to query by when deleting the document
 * @param whats The required 'what' in the request body
 * @param ENOTFOUND The error message to send if the document is not found
 * @param is_not_objectid Are we NOT querying by an ObjectId?
 * @param RefModel: Model<any> The model of the referencing documents
 * @param refField: string he field in the referencing documents that contains the reference
 */
async function __data_table_trigger_delete(
  req: Request,
  res: Response,
  Model: Model<any>,
  field: string,
  whats: string,
  ENOTFOUND: string,
  is_not_objectid: boolean = false,
  RefModel?: Model<any>, // The model of the referencing documents
  refField?: string, // The field in the referencing documents that contains the reference
  staffRequired: boolean = true // If staff is required in order to call this function
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

  // Trigger this only if a staff member is required
  if (staffRequired) {
    // Is this person a staff member?
    // @ts-ignore
    if (!user.staff) {
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
    }
  }
  // Extract the object ID from the request body
  const objectId = wis_string(req);
  // Check if objectId is a valid MongoDB ObjectId if is_not_object is false
  if (!is_not_objectid) {
    if (!mongoose.Types.ObjectId.isValid(objectId)) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
  }
  let query = `{ "${field}": "${objectId}" }`; // Hack-ish
  let object;
  // Find the object by ID and delete it
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
  // Delete all documents that reference the object
  if (RefModel && refField) {
    await RefModel.deleteMany({ [refField]: object._id });
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
  whats: string,
  public_access: boolean | undefined,
  staff_required: boolean | undefined,
  populationArray: { path: string; model: string }[] | undefined
) {
  // We don't need a body since we're doing the 'what_is' this time

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user && !public_access) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (staff_required && !user?.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // Get all objects from the database
  const object = await Model.find().populate(populationArray ?? []);

  // Return the objects as a JSON response
  return res.json(what_is(whats, object));
}

export {
  __data_table_trigger_delete as delete_object,
  __data_table_trigger_list as list_object,
};
