import Filter from "bad-words";
import bcrypt from "bcryptjs";
import cryptoRandomString from "crypto-random-string";
import { Request, Response } from "express";
import mongoose from "mongoose";
import settings from "../../../../config/settings.json";
import User from "../../../../database/models/Users";
import {
  EmailTemplate,
  generateActivationToken,
  sendEmail,
} from "../../../../util/email";
import { ErrorFormat, iwe_strings } from "../../../strings";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array, wis_string } from "../../../utility/What_Is";
import what from "../../../utility/Whats";
import { delete_object, list_object } from "../../../utility/batchRequest";

/***** BAD WORDS FILTER *****/
const filter = new Filter();
filter.removeWords(...settings.server.excludedBadWords); // https://www.npmjs.com/package/bad-words#remove-words-from-the-blacklist
/************************** */

async function user_find(req: Request, res: Response) {
  // We can also search by ID
  const id = req.query.user_id;
  const authenticatedUser = await get_authorization_user(req);
  let user; // Later defined

  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    }
    user = await User.findById(id);
    if (!user) {
      return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND2));
    }
    // Redact the token only if querying other users
    // @ts-ignore
    if (user._id.toString() != authenticatedUser?._id.toString()) {
      // @ts-ignore
      user.token = undefined; // @ts-ignore
      user.reset_token = undefined; // @ts-ignore
      user.activation_token = undefined; // Remove token on public route
    }
  } else {
    // Check for authenticated user
    user = authenticatedUser;
    if (!user) {
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
    }

    // User will always be defined
    // Populate the "product" field in the cart
    // @ts-ignore
    await user.populate({
      path: "cart.product",
      model: "Products",
    });
  }

  // @ts-ignore
  return res.json(what_is(what.public.user, user));
}

async function user_list(req: Request, res: Response) {
  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user?.staff) {
    return res // Some overlay permitting limited access to non-staff members. We're just giving them access to themselves (must be array)
      .json(what_is(what.private.user, [user]));
  }
  await list_object(req, res, User, what.private.user, false, true);
}
async function user_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.user) {
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
  const [
    username,
    email,
    password,
    staff,
    credit,
    restrictions,
    bypassActivation,
  ] = wis_array(req);

  // Start verification
  const testFailed = check_values(
    res,
    username,
    password,
    email,
    staff,
    credit,
    restrictions,
    bypassActivation
  );
  if (testFailed) return;
  // End verification
  // Search for dupes
  const user_dupe = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (user_dupe) {
    return res.status(400).json(ErrorFormat(iwe_strings.Authentication.ETAKEN));
  }

  // Create the user
  const hashedPassword = await bcrypt.hash(
    password,
    settings.auth.activation["hash-rounds"]
  );

  const userID = Math.round(new Date().getTime() / 1000).toString();
  const newUser = await User.create({
    // Create a new user
    id: userID,
    email,
    password: hashedPassword,
    username,
    staff,
    credit: parseFloat(credit).toFixed(2),
    channel_id: cryptoRandomString({
      length: settings.auth["token-length"],
      type: "alphanumeric",
    }), // Unset
    cart: undefined,
    activation_token: undefined,
    token: null,
    reset_token: null,
    restrictions,
  });
  // Set the channelID
  newUser.channel_id = `user_${newUser._id}`;

  if (!bypassActivation) {
    const activationToken = await generateActivationToken(email);
    if (activationToken === -1) {
      return res
        .status(500)
        .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
    }

    try {
      await sendEmail(
        email,
        iwe_strings.Authentication.ENEEDSACTIVATION,
        null,
        EmailTemplate("ACTIVATE", username, activationToken)
      );
    } catch (error) {
      return res
        .status(500)
        .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
    }
  }

  await newUser.save();
  return res.status(201).json(what_is(what.private.user, newUser));
}

// Users can't really (at all) delete themseleves. They have to request deletion from a staff member
// Because, I'm too lazy to add that in right now, so I'm just going to make it an admin function :/
async function user_delete(req: Request, res: Response) {
  await delete_object(
    req,
    res,
    User,
    "_id",
    what.private.user,
    iwe_strings.Users.ENOTFOUND
  );
}

// Users can edit only their username and password
// Other admin functions are not allowed
async function user_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.user) {
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

  // Extract information from the 'what_is' object
  const [
    old_username,
    username,
    password,
    email,
    staff,
    credit,
    restrictions,
    { action = null, action_num = null } = {},
  ] = wis_array(req);

  // Start verification
  // Decieve check-values safeguard for staff members
  // to allow for optional arguments
  // @ts-ignore
  const testFailed = user?.staff
    ? check_values(
        res,
        old_username,
        "Unu$ed12345",
        email,
        staff,
        credit,
        restrictions,
        false, // Unused
        username,
        action,
        action_num
      )
    : check_values(
        res,
        old_username,
        password,
        email,
        staff,
        credit,
        restrictions,
        false, //unused
        username,
        action,
        action_num
      );
  if (testFailed) return;
  // End verification

  // Grab the user
  const user_ = await User.findOne({
    username: old_username,
  });
  if (!user_) {
    return res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND2));
  }

  // Search for dupes
  const user_dupe = await User.findOne({
    username,
  });

  // Return an error if both users are not the same
  if (user_dupe && user_dupe._id.toString() !== user_._id.toString()) {
    return res.status(400).json(ErrorFormat(iwe_strings.Authentication.ETAKEN));
  }

  // Is this person a staff member? We only allow users to edit themselves
  // @ts-ignore
  if (!user.staff && user._id.toString() != user_._id.toString()) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  switch (action) {
    case "m":
      if (username) {
        user_.username = username;
      }
      if (password) {
        // Generate the password
        const hashedPassword = await bcrypt.hash(
          password,
          settings.auth.activation["hash-rounds"]
        );
        user_.password = hashedPassword;
      }
      // Beyond this point you need to be staff
      // @ts-ignore
      if (user.staff) {
        // Only staff can run these functions
        if (email) {
          user_.email = email;
        }
        if (typeof staff === "boolean") {
          if (user_.username == "root" && !staff) {
            return res
              .status(400)
              .json(ErrorFormat(iwe_strings.Users.ECANTUNSTAFFROOT));
          }
          user_.staff = staff; // Yeah, just in case still
        }
        if (credit) {
          // @ts-ignore
          user_.credit = parseFloat(credit).toFixed(2);
        }
        if (restrictions) {
          user_.restrictions = restrictions;
        }
      }
      break;
    case "f":
      // @ts-ignore
      if (!user.staff) {
        // Only staff can run these functions
        return res
          .status(403)
          .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
      }
      switch (action_num) {
        case 1: // Invalidate token
          user_.token = undefined;
          break;
        case 2: // Trigger activation
          if (user_.username === "root")
            return res
              .status(400)
              .json(ErrorFormat(iwe_strings.Users.ECANTBLOCKROOT));
          const _aT = await generateActivationToken(user_.email);
          if (_aT == -1)
            return res
              .status(500)
              .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
          user_.activation_token = _aT;

          user_.token = undefined;
          user_.reset_token = undefined;
          break;
        case 3: // Lockout user
          if (user_.username === "root")
            return res
              .status(400)
              .json(ErrorFormat(iwe_strings.Users.ECANTLOCKOUTROOT));
          user_.token = undefined;
          user_.reset_token = undefined;
          user_.password = cryptoRandomString({
            length: settings.auth.lockout["token-length"],
            type: "alphanumeric",
          });
          user_.activation_token = undefined;
          break;
        case 4: // Delete user
          if (user_.username === "root")
            return res
              .status(400)
              .json(ErrorFormat(iwe_strings.Users.ECANTDELETEROOT));
          await user_.deleteOne();
          return res.json({ status: true });
        case 5: // Ban the user
          if (user_.username === "root")
            return res
              .status(400)
              .json(ErrorFormat(iwe_strings.Users.ECANTBLOCKROOT));
          user_.activation_token = undefined;
          user_.token = undefined;
          user_.reset_token = undefined;
          user_.restrictions = -1; // banned
          break;
        default:
          return res
            .status(400)
            .json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
      }
      break;

    default:
      return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  await user_.save();
  return res.json({ status: true });
}

function check_values(
  res: Response,
  username: string,
  password: string,
  email: string,
  staff: boolean,
  credit: number,
  restrictions: number,
  bypassActivation: boolean,
  old_username?: string,
  action?: string,
  action_num?: number
) {
  // Check if required parameters are provided
  if (
    !username ||
    !password ||
    !email ||
    staff === undefined ||
    (credit && typeof credit != "number") ||
    restrictions === undefined ||
    (old_username && typeof old_username != "string") ||
    (old_username && old_username.trim() === "") ||
    (username && username.trim() === "") ||
    (bypassActivation && typeof bypassActivation != "boolean") ||
    (action && typeof action != "string") ||
    (action_num && Number.isNaN(action_num))
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check if username is a non-empty string
  if (
    typeof username !== "string" ||
    username.trim() === "" ||
    (!old_username && filter.isProfane(username)) || // Really weird stuff going on. Don't change this condition. It's correct.
    (old_username && filter.isProfane(old_username)) ||
    (!old_username &&
      username.length > settings.auth.activation["username-length"]) || // Here too. Don't change. It's also correct.
    (old_username &&
      old_username.length > settings.auth.activation["username-length"]) // Most names aren't longer than this.
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDUNAME));
  }

  // Check if password is a non-empty string
  if (
    !password ||
    typeof password !== "string" ||
    password.length < settings.auth.activation["password-length"] ||
    !iwe_strings.Authentication.UCOMPLEXITY.test(password) ||
    password.trim() === ""
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDPASWD));
  }

  // Check if email is a valid email
  if (
    !email ||
    typeof email !== "string" ||
    !iwe_strings.Email.UDETECT.test(email) ||
    email.trim() === "" ||
    !email.endsWith("@ub.edu.bz") ||
    email.trim() === ""
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDEMAIL));
  }

  // Check if staff is a boolean
  if (typeof staff !== "boolean") {
    return res.status(400).json({ error: "Invalid staff value" });
  }

  // Check if credit is a number
  if (typeof credit !== "number") {
    return res.status(400).json({ error: "Invalid credit value" });
  }
  // Check if restrictions is a number
  if (typeof restrictions !== "number") {
    return res.status(400).json({ error: "Invalid restrictions value" });
  }

  // If all checks pass, return null
  return null;
}

async function user_modify_picture(
  req: Request,
  res: Response,
  type: "profile_picture" | "banner"
) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.user) {
    // Two underscores means it's an admin function
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }

  // Check our authentication token and see if it matches up to a valid user
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Extract information from the 'what_is' object
  const picture = wis_string(req);

  // Start verification
  // Check if this is a valid link
  const isValidUrl = (url) => {
    try {
      const parsedUrl = new URL(url);

      // Check if the hostname is in the allowed domains list
      if (settings.server.bucket !== parsedUrl.hostname) {
        // If the hostname is not in the allowed list, consider it invalid
        return res
          .status(400)
          .json(ErrorFormat(iwe_strings.Users.EBADRESOURCE));
      }
    } catch (error) {
      // URL parsing failed
      return res.status(400).json(ErrorFormat(iwe_strings.Users.EBADRESOURCE));
    }
    return true;
  };
  if (isValidUrl(picture)) {
    // Process the fetch response and check if it sucessfully uploaded
    try {
      const r = await fetch(picture);
      if (!r.ok) {
        return res
          .status(400)
          .json(ErrorFormat(iwe_strings.Users.EBADRESOURCE));
      }
      // } else {
      //    // Handle the case where the URL is not valid or not whitelisted (potential SSRF attempt)
      //    return res.status(400).json(ErrorFormat(iwe_strings.Users.EBADRESOURCE));
      // }
      // End verification
      // @ts-ignore
      user[type] = picture; // @ts-ignore
      await user.save();
      return res.json({ status: true });
    } catch {
      try {
         return res.status(400).json(ErrorFormat(iwe_strings.Users.EBADRESOURCE));
      } catch {
         // Nothing to do here 
      }
    }
  }
}

export {
  user_create,
  user_delete,
  user_find,
  user_list,
  user_modify,
  user_modify_picture,
};
