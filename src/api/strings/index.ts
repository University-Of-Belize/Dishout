import config from "../../config/settings.json";

class IWE_STRINGS {  // Info, Warning, Error Strings
  Authentication = {
    EENFORCEMENT_FAILED: `Illegal password. Your password should be at least ${config.auth.activation["password-length"]} characters in length and follow the enforcement rules of there being AT LEAST\n
       1. An UPPERCASE character (Such as: ABC)\n
       2. A LOWERCASE character (Such as: abc)\n
       3. A NUMBER (Such as: 123)\n4. And a SPECIAL CHARACTER (Such as: !@#)`,
    EINVALIDEMAIL: "Invalid Email, please enter a valid email.",
    EINVALIDUNAME: "Invalid username, please enter a valid username.",
    EINVALIDPASWD: "Invalid password, please enter a valid password.",
    ETAKEN: "Username is taken or email is already registered.",
    EDISABLED:
      "Your account has been disabled. Please do not create a new account. Instead, contact an administrator for assistance.",
    ENEEDSACTIVATION:
      "In order to continue, your account requires activation. Check your inbox for further instructions.",
    ENEEDSACTIVATION2:
      "Please activate your account to continue. Check your inbox for further instructions.",
    EBADAUTH: "Incorrect username or password.",
  };
  Email = {
   ENOTVERIFIED: `In order finish creating your ${config.server.nickname} account and help us verify that you're human, we need to verify your email address.`,
   IDISCLAIMER: `You're receiving this email because you recently created a new ${config.server.nickname} account. If this wasn't you, please ignore this email.`,
   IRESETPASSWORD: "Hi, it seems as if you requested a password reset link. Here you go! Please do not share this link with anyone. If you did not request this email, please ignore it.";
  }
  Friending = {
    ECANNOTADDYOURSELF: "You cannot add yourself",
    ESENTREQUEST_PREVIOUSLY:
      "You already sent a friend request to this user!",
  };
  Generic = {
    EBADPARAMS: "The parameters provided are incorrect.",
    EDATANOTFOUND: "The requested data could not be fetched in time.",
    EINTERNALERROR: "There was a system error. Please try again.",
    ENOACCESS: "You do not have permission to call this portion of the API.",
  };
  Users = {
    ENOTFOUND: "The specified user could not be found using the provided ID.",
    EFRIENDLYNOTFOUND:
      "Failed to find user, please make sure you didn't make any spelling errors!",
  };

}

const iwe_strings = new IWE_STRINGS();
function Error(error: string) {
  return {
    message: error,
    status: false,
  };
}

export { Error as ErrorFormat, iwe_strings };
export default iwe_strings;
