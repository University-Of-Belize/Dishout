import User from "../database/models/Users";
import cryptoRandomString from "crypto-random-string";
import config from "../config/settings.json";
const nickname = config.server.nickname;
import IWE from "../api/strings";
import process from "node:process";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { LogError } from "./Logger";

// Email Address
const EmailAddress = `${config.email.username}@${config.email.domain}`;

async function generateActivationToken(user_email: string) {
  const user = await User.findOne({ email: user_email.toLowerCase() });
  if (!user) {
    return -1;
  }
  const AKey = `dak-${cryptoRandomString({
    length: config.auth.activation["token-length"],
    type: "alphanumeric",
  })}`;
  user.activation_token = AKey; // generate and return random token if password is correct
  user.save();
  return AKey;
}

async function sendEmail(
  email: string,
  subject: string,
  body: string | null,
  html_body: string | null
) {
  try {
    let transporter = nodemailer.createTransport({
      host: config.email.smtp.server,
      port: config.email.smtp.port,
      secure: config.email.smtp.https, // true for 465, false for other ports
      auth: {
        user: EmailAddress, // full email-address (username)
        pass:
          process.env.MAIL_PASSWORD ?? config.email["dev-password"] ?? "unset", // password (App password)
      },
    });

    const genericText = body ?? "";
    await transporter.sendMail({
      from: `"${config.email["display-name"]}" <${EmailAddress}>`, // sender address
      to: email, // list of receivers
      subject: subject, // Subject line
      text: genericText ?? "", // plain text body
      html: html_body ?? genericText ?? "", // html body
    });
  } catch (e) {
    console.log("\n\n");
    LogError(
      `Couldn't send email. This was the email:\n\nTO: <${email}>\nSUBJECT: ${subject}\nBODY: ${
        html_body ?? body ?? ""
      }`
    );
  }
}

function EmailTemplate(email_type: string, name: string | null, token: string) {
  let title,
    body,
    subtitle = "";
  switch (email_type) {
    case "ACTIVATE":
      const VerificationTemplate = fs.readFileSync(
        path.join(__dirname, "verify.html")
      );
      // These are used in the template ------------------------------------
      const VerificationLink = `https://${config.server.domain}/auth/verify?activation_token=${token}`;
      title = "";
      body = IWE.Email.ENOTVERIFIED;
      subtitle = IWE.Email.IDISCLAIMER;
      // ---------------------------------------------------
      return eval("`" + VerificationTemplate.toString() + "`"); // Evaluate the template and return it

    case "PASSWORD_RESET":
      const PasswordTemplate = fs.readFileSync(
        path.join(__dirname, "reset.html")
      );
      // These are used in the template ------------------------------------
      title = IWE.Email.IRESETPASSWORD;
      body = `<br/>
        <a href="https://${config.server.domain}/auth/reset?reset_token=${token}">https://${config.server.domain}/auth/reset?reset_token=${token}</a>`;
      subtitle = "";
      // ---------------------------------------------------
      return eval("`" + PasswordTemplate.toString() + "`"); // Evaluate the template and return it
  }
}

export { generateActivationToken, sendEmail, EmailTemplate };
