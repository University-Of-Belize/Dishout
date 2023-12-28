import { get_authorization } from "../../utility/Authentication";
import {
  generateActivationToken,
  sendEmail,
  EmailTemplate,
} from "../../../util/email";
import User from "../../../database/models/Users";
import { what_is, wis_string, wis_array } from "../../utility/What_Is";
import what from "../../utility/Whats";
import { LogError, LogWarn } from "../../../util/Logger";
import { ErrorFormat, iwe_strings } from "../../strings";
import settings from "../../../config/settings.json";
import cryptoRandomString from "crypto-random-string";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Filter from "bad-words";
import { isValidTimeZone } from "../../utility/time";

/***** BAD WORDS FILTER *****/
const filter = new Filter();
filter.removeWords(...settings.server.excludedBadWords); // https://www.npmjs.com/package/bad-words#remove-words-from-the-blacklist
/************************** */

// Register a new user
async function auth_register(req: Request, res: Response) {
  // Start the checks
  if (req.body["what"] != what.public.auth) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [email, username, password, timezone] = wis_array(req);

  if (
    !email ||
    typeof email !== "string" ||
    !iwe_strings.Email.UDETECT.test(email) ||
    email.trim() === ""
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDEMAIL));
  }

  if (
    !username ||
    typeof username !== "string" ||
    username.trim() === "" ||
    filter.isProfane(username)
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDUNAME));
  }

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

  if (!email.endsWith("@ub.edu.bz")) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDDOMAIN));
  }

  if (!timezone || !isValidTimeZone(timezone)) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDTIMEZONE));
  }
  // Create the user if all the checks pass
  const hashedPassword = await bcrypt.hash(
    password,
    settings.auth.activation["hash-rounds"]
  );

  try {
    /********************* Remove after 100 users sign-up *************************/
    const arr = Array(1000)
      .fill(0)
      .map((_, i) => (i < 10 ? 100 : (i % 10) + 1));
    const randomNum = arr[Math.floor(Math.random() * arr.length)];
    /************************************************************************* */
    const userID = Math.round(new Date().getTime() / 1000).toString();
    await User.create({
      // Create a new user
      id: userID,
      email,
      password: hashedPassword,
      username,
      staff: username === "root", // Make user 'staff' if they are root
      // credit: 0.0, @remind Remove after 100 users sign-up
      credit: randomNum,
      cart: undefined,
      activation_token: null,
      token: null,
      timeZone: timezone,
      reset_token: null,
      restrictions: 0,
    });

    const activationToken = await generateActivationToken(email);
    if (activationToken === -1) {
      return res
        .status(500)
        .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
    }

    await sendEmail(
      email,
      iwe_strings.Authentication.ENEEDSACTIVATION,
      null,
      EmailTemplate("ACTIVATE", username, activationToken)
    );

    return res.status(201).json({
      status: true,
      message: iwe_strings.Authentication.ENEEDSACTIVATION2,
    });
  } catch (err: any) {
    LogWarn(err);
    console.log(err);
    if (err.code === 11000) {
      return res
        .status(406)
        .json(ErrorFormat(iwe_strings.Authentication.ETAKEN));
    }
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }
}

// Verify after registering
async function auth_verify(req: Request, res: Response) {
  // We're just passing in the token through the header
  const activation_token = get_authorization(req);
  if (!activation_token) {
    return res.sendStatus(422);
  }

  let userRequest;
  try {
    userRequest = await User.findOne({
      activation_token,
    });
  } catch (error: any) {
    return res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND2));
  }

  const user = userRequest;
  try {
    if (!user) {
      return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
    }

    // Send the congrats email
    await sendEmail(
      user.email,
      iwe_strings.Email.ICLAIMBONUS,
      null,
      EmailTemplate(
        "BONUS_CLAIM",
        user.username,
        undefined,
        user.credit.toString()
      )
    );

    user.activation_token = undefined;
    await user.save();
    return res.json({
      status: true,
    });
  } catch (err: any) {
    res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND2)); // Bad request
    LogError(err);
  }
}

// Login the user
async function auth_login(req: Request, res: Response) {
  // Start the checks
  if (req.body["what"] != what.public.auth) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [username, password] = wis_array(req);

  try {
    const user =
      (await User.findOne({ username })) ??
      (await User.findOne({ email: username.toLowerCase() }));
    if (!user) {
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
    }

    if (user.activation_token) {
      const newAT = await generateActivationToken(user.email);
      await sendEmail(
        user.email,
        iwe_strings.Email.ENEEDSACTIVATION,
        null,
        EmailTemplate(
          "ACTIVATE",
          user.username,
          newAT == -1
            ? user.activation_token
            : newAT == undefined
            ? user.activation_token
            : newAT
        )
      );
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.ENEEDSACTIVATION));
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
    }

    if (user.restrictions == -1) {
      // Lockout the user
      user.reset_token, user.activation_token, (user.token = undefined);
      user.save();
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.EBLOCKED));
    }

    // Create a login
    user.token = `dtk-${cryptoRandomString({
      length: settings.auth["token-length"],
      type: "alphanumeric",
    })}`; // generate and return random token if password is correct
    if (user.reset_token) {
      user.reset_token = undefined; // If bro remembers his password we delete his reset token;
    }
    await user.save(); // Save that shizzz
    return res.json(what_is(what.public.auth, [user._id, user.token]));
  } catch (err: any) {
    res.sendStatus(400); // Bad request
    LogError(err);
  }
}

// Reset the password (request a reset link)
async function auth_forgot(req: Request, res: Response) {
  if (req.body["what"] != what.public.auth) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  let userRequest;
  const username = wis_string(req);

  try {
    userRequest =
      (await User.findOne({ username })) ??
      (await User.findOne({ email: username })) ??
      (await User.findOne({ id: parseInt(username) }));
  } catch (error: any) {
    return res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
  }

  const user = userRequest;
  // console.log(user);  // debug
  try {
    if (!user) {
      return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
    }

    const RKey = `drk-${cryptoRandomString({
      length: settings.auth.reset["token-length"],
      type: "alphanumeric",
    })}`;

    user.reset_token = RKey;
    await user.save();

    await sendEmail(
      user.email,
      iwe_strings.Email.INEEDSRESET,
      null,
      EmailTemplate("PASSWORD_RESET", user.username, RKey)
    );

    return res.json({
      message: iwe_strings.Email.IRESETSENT,
      status: true,
    });
  } catch (err: any) {
    res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
    LogError(err);
  }
}
// Reset the password
async function auth_reset(req: Request, res: Response) {
  if (req.body["what"] != what.public.auth) {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const text = wis_string(req);
  const reset_token = get_authorization(req);

  let userRequest;
  try {
    userRequest = await User.findOne({
      reset_token,
    });
  } catch (error: any) {
    return res.sendStatus(400);
  }

  const user = userRequest;

  if (!user) {
    return res
      .status(400)
      .json(ErrorFormat(iwe_strings.Authentication.EBADRSTTKN));
  }

  if (!text || typeof text !== "string") {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDPASWD));
  } else if (
    text.length < settings.auth.activation["password-length"] ||
    !iwe_strings.Authentication.UCOMPLEXITY.test(text)
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EENFORCEMENT_FAILED));
  }
  if (bcrypt.compareSync(text, user.password)) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EBADPSWD));
  }

  const password = await bcrypt.hash(text, 10);

  user.password = password;
  user.token = undefined; // Sign out everyone
  user.reset_token = undefined;
  await user.save();

  return res.json({
    status: true,
  });
}
export { auth_login, auth_register, auth_forgot, auth_reset, auth_verify };
