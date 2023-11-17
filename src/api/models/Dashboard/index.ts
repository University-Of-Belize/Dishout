// Import our proper types
import { Request, Response } from "express";
// Import the promotion
import settings from "../../../config/settings.json";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { what_is } from "../../utility/What_Is";
import what from "../../utility/Whats";

// modify menu
async function dash_list(req: Request, res: Response) {
  // Get the dashboard
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
    return res.json(what_is(what.private.dash, settings.dashboard.customer));
  }

  return res.json(what_is(what.private.dash, settings.dashboard.admin));
}

export { dash_list };
