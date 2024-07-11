import { Request, Response } from "express";
import Promo from "../../../database/models/Promos";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { wis_string } from "../../utility/What_Is";
import what from "../../utility/Whats";

async function promo_validate(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.promos) {
    // Two underscores means it's an admin function
    return res.status(418).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  const discount_code = wis_string(req);
  const promo = await Promo.findOne({ code: discount_code }); // Accept codes instead of ObjectIds

  // This should be a feature only signed-in users can access
  if (!user) {
    return res.status(403).json(ErrorFormat(iwe_strings.Generic.ENOACCESS));
  }

  if (promo) {
    if (((promo?.expiry_date ?? 1) * 1000) < Date.now()) {
      return res
        .status(410)
        .json({ status: false, message: iwe_strings.Promo.IEXPIRED });
    }
    return res
      .status(200)
      .json({ status: true, message: iwe_strings.Promo.IEXISTS });
  } else {
    return res
      .status(404)
      .json({ status: false, message: iwe_strings.Promo.ENOTFOUND });
  }
}

export { promo_validate };
