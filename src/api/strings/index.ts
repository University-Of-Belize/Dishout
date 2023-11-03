import config from "../../config/settings.json";

class IWEU_STRINGS {
  // Info, Warning, Error Strings
  Authentication = {
    EENFORCEMENT_FAILED: `Illegal password. Your password should be at least ${config.auth.activation["password-length"]} characters in length and follow the enforcement rules of there being AT LEAST\n
       1. An UPPERCASE character (Such as: ABC)\n
       2. A LOWERCASE character (Such as: abc)\n
       3. A NUMBER (Such as: 123)\n4. And a SPECIAL CHARACTER (Such as: !@#)`,
    EINVALIDDOMAIN:
      "Invalid email domain. Only email addresses with the domain '@ub.edu.bz' are allowed.",
    ENOACCESS: "You do not have permission to call this portion of the API.",
    EINVALIDEMAIL: "Invalid Email, please enter a valid email.",
    EINVALIDUNAME: "Invalid username, please enter a valid username.",
    EINVALIDPASWD: "Invalid password, please enter a valid password.",
    EBADPSWD: "Please choose a different password.",
    ETAKEN: "Username is taken or email is already registered.",
    EDISABLED:
      "Your account has been disabled. Please do not create a new account. Instead, contact an administrator for assistance.",
    ENEEDSACTIVATION:
      "In order to continue, your account requires activation. Check your inbox for further instructions.",
    ENEEDSACTIVATION2:
      "Please activate your account to continue. Check your inbox for further instructions.",
    EBADAUTH: "Incorrect username or password.",
    EBLOCKED: "Sorry, you've been blocked from our services.",
    EOOPS:
      "Oops! Looks like something went wrong on our end! Please try that again.",
    UCOMPLEXITY:
      /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
  };
  Email = {
    ENEEDSACTIVATION: `${config.server.nickname} — Please Verify Your Account To Continue`,
    INEEDSRESET: `${config.server.nickname} — Your Password Reset Link`,
    IRESETSENT: "Reset link sent. Please check your inbox.",
    ENOTVERIFIED: `In order finish creating your ${config.server.nickname} account and help us verify that you're human, we need to verify your email address.`,
    IDISCLAIMER: `You're receiving this email because you recently created a new ${config.server.nickname} account. If this wasn't you, please ignore this email.`,
    IRESETPASSWORD:
      "Hi, it seems as if you requested a password reset link. Here you go! Please do not share this link with anyone. If you did not request this email, please ignore it.",
    UDETECT:
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
  };
  Friending = {
    ECANNOTADDYOURSELF: "You cannot add yourself",
    ESENTREQUEST_PREVIOUSLY: "You already sent a friend request to this user!",
  };
  Generic = {
    EBADPARAMS: "The parameters provided are incorrect.",
    EDATANOTFOUND: "The requested data could not be fetched in time.",
    EINTERNALERROR: "There was a system error. Please try again.",
    ENOACCESS: "You do not have permission to call this portion of the API.",
    EFOLLOWRULES: "Follow the rules.",
  };
  Users = {
    ENOTFOUND: "The specified user could not be found using the provided ID.",
    ENOTFOUND2: "That user was not found.",
    EFRIENDLYNOTFOUND:
      "Failed to find user, please make sure you didn't make any spelling errors!",
  };
  Order = {
    EONOEXISTS: "Order not found.",
    IDELETE: "Order deleted successfully.",
    IACCEPT: "Order accepted.",
    IOSTATUSQUEUED: "Your order has been queued.",
    IOSTATUSACCEPTED: "Your order has been accepted.",
    IOSTATUSDENIED: "Your order has been rejected.",
    IOSTATUSDELAYED: "Your order has been delayed.",
    IOSTATUSMODIFIED: "A staff member has issued an update your order.",
    EEMPTYCART: "The shopping cart is empty",
  };
  Promo = {
    ECODEEXISTS: "Promo code already exists.",
    ENICKEXISTS: "Promo nickname already exists.",
    ENOTFOUND: "Promotion not found.",
  };
  Review = {
    ENOTFOUND: "Review not found.",
    EPRODNOEXISTS: "Product not found.",
    EUNAUTHORIZED: "You do not own this review.",
  };
  Category = {
    ENOTFOUND: "Category not found.",
    EEXISTS: "Category or alias exists. Please choose another name or alias.",
  };
  Product = {
    ENOTFOUND: "Product not found.",
    EOUTOFSTOCK: "Product out of stock.",
    ETOOMANY: "Your request exceeds our maximum availability of that product.",
  };
}

const iwe_strings = new IWEU_STRINGS();
function createError(error: string) {
  return {
    message: error,
    status: false,
  };
}

export { createError as ErrorFormat, iwe_strings };
export default iwe_strings;
