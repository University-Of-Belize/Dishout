import {
  get_authorization_user,
  get_authorization,
} from "../../utility/Authentication";
import {
  generateActivationToken,
  sendEmail,
  EmailTemplate,
} from "../../../util/email";
import User from "../../../database/models/Users";
import { what_is } from "../../utility/What_Is";
import { LogError, LogInfo, LogWarn } from "../../../util/Logger";
import { ErrorFormat, iwe_strings } from "../../strings";
import settings from "../../../config/settings.json";
import cryptoRandomString from "crypto-random-string";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

async function auth_register(req: Request, res: Response) {
  // Start the checks
  if (req.body["what"] != "auth") {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [email, username, password] = req.body["is"];

  if (
    !email ||
    typeof email !== "string" ||
    !iwe_strings.Email.UDETECT.test(email)
  ) {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDEMAIL));
  }

  if (!username || typeof username !== "string") {
    return res
      .status(406)
      .json(ErrorFormat(iwe_strings.Authentication.EINVALIDUNAME));
  }

  if (
    !password ||
    typeof password !== "string" ||
    password.length < settings.auth.activation["password-length"] ||
    !iwe_strings.Authentication.UCOMPLEXITY.test(password)
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

  // Create the user if all the checks pass

  const hashedPassword = await bcrypt.hash(
    password,
    settings.auth.activation["hash-rounds"]
  );

  try {
    const userID = Math.round(new Date().getTime() / 1000).toString();
    const user = await User.create({
      // Create a new user
      id: userID,
      email,
      password: hashedPassword,
      username,
      staff: false,
      credit: 0.0,
      cart: [],
      activation_token: null,
      token: null,
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

    LogInfo(`
        Email: ${email}\n
        Username: ${username}\n
        Password/Token: ${password}\n
        Activated: ${user.activation_token ? "No" : "Yes"}\n
        `);

    return res.json({
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
function auth_verify(req: Request, res: Response) {
  if (req.body["what"] != "auth") {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [username, password] = req.body["is"];
}

// Login the user
async function auth_login(req: Request, res: Response) {
  // Start the checks
  if (req.body["what"] != "auth") {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [username, password] = req.body["is"];

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
      await generateActivationToken(user.email);
      await sendEmail(
        user.email,
        iwe_strings.Email.ENEEDSACTIVATION,
        null,
        EmailTemplate("ACTIVATE", user.username, user.activation_token)
      );
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.ENEEDSACTIVATION));
    }

    if (password !== user.password) {
      return res
        .status(403)
        .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
    }

    // Create a login
    user.token = `dtk-${cryptoRandomString({
      length: 45,
      type: "alphanumeric",
    })}`; // generate and return random token if password is correct
    if (user.reset_token) {
      user.reset_token = undefined; // If bro remembers his password we delete his reset token;
    }
    user.save(); // Save that shizzz
    return res.json(what_is("auth", [user.id, user.token]));
  } catch (err: any) {
    res.sendStatus(400); // Bad request
    LogError(err);
  }
}
function auth_reset(req: Request, res: Response) {
  if (req.body["what"] != "auth") {
    return res.status(418).send(iwe_strings.Generic.EFOLLOWRULES);
  }
  const [username, password] = req.body["is"];
}

export { auth_login, auth_register, auth_reset, auth_verify };
