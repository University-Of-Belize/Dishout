// Import our proper types
import { Request, Response } from "express";
// Import the promotion
import Promo from "../../../../database/models/Promos";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import what from "../../../utility/Whats";
import { wis_array } from "../../../utility/What_Is";
import { delete_object, list_object } from "../../../utility/batchRequest";

// List all promotions
async function promo_list(req: Request, res: Response) {
    await list_object(req, res, Promo, what.private.promos, false, true);
}

// Create a new promotion
async function promo_create(req: Request, res: Response) {
    // Check our 'what_is'
    if (req.body["what"] != what.private.promos) {
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

    // Extract information from the 'what_is' object
    const [code, nickname, description, discount, start_date, end_date] =
        wis_array(req);

    // Start verification
    const testFailed = check_values(
        res,
        code,
        undefined,
        nickname,
        description,
        discount,
        start_date,
        end_date
    );
    if (testFailed) return;
    // End verification

    // Check if the code and description are unique
    const existingPromo = await Promo.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
        return res.status(400).json(ErrorFormat(iwe_strings.Promo.ECODEEXISTS));
    }
    // Using this, we now create the promotion
    const newPromo = await Promo.create({
        code: code.toUpperCase(),
        description: description,
        discount_percentage: discount,
        start_date: start_date,
        expiry_date: end_date, // @ts-ignore
        created_by: user._id,
    });

    // Add the nickname field if it is provided
    if (nickname && nickname != null) {
        newPromo.nickname = nickname;
    }

    await newPromo.save();
    return res.json({
        status: true,
    });
}

// Delete a promotion
async function promo_delete(req: Request, res: Response) {
    await delete_object(
        req,
        res,
        Promo,
        "code",
        what.private.promos,
        iwe_strings.Promo.ENOTFOUND
    );
}

// Modify a promotion
async function promo_modify(req: Request, res: Response) {
    // Check our 'what_is'
    if (req.body["what"] != what.private.promos) {
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

    // Extract the fields to update from the request body
    const [
        code,
        new_code,
        nickname,
        description,
        discount,
        start_date,
        end_date,
    ] = wis_array(req);

    // Start verification

    const testFailed = check_values(
        res,
        code,
        new_code,
        nickname,
        description,
        discount,
        start_date,
        end_date
    );
    if (testFailed) return;
    // End verification

    // Find the promotion by ID and update it
    const promo = await Promo.findOne({ code: code.toUpperCase() });
    if (!promo) {
        return res.status(404).json(ErrorFormat(iwe_strings.Promo.ENOTFOUND));
    }
    const code_used = await Promo.findOne({ code: new_code.toUpperCase() });
    if (code_used) {
        return res.status(406).json(ErrorFormat(iwe_strings.Promo.ECODEEXISTS));
    }

    // Update the promotion fields
    if (new_code) {
        promo.code = new_code.toUpperCase();
    }
    if (nickname) {
        promo.nickname = nickname;
    }
    if (description) {
        promo.description = description;
    }
    if (start_date) {
        promo.start_date = start_date;
    }
    if (end_date) {
        promo.expiry_date = end_date;
    }

    await promo.save();

    return res.json({
        status: true,
    });
}

function check_values(
    res: Response,
    code: string,
    new_code: string | undefined,
    nickname: string,
    description: string,
    discount: number,
    start_date: number,
    end_date: number
) {
    if (
        !code ||
        typeof code != "string" ||
        (new_code && typeof new_code != "string") ||
        !nickname ||
        typeof nickname != "string" ||
        !description ||
        typeof description != "string" ||
        !end_date ||
        !Number.isInteger(end_date)
    ) {
        return res
            .status(400)
            .json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    if (!Number.isInteger(discount) || !Number.isInteger(start_date)) {
        return res
            .status(400)
            .json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    return 0; // Tests passed; No errors
}

export { promo_create, promo_list, promo_delete, promo_modify };
