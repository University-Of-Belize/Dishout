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
    EINVALIDEMAIL: "Invalid email, please enter a valid email.",
    EINVALIDUNAME: "Invalid username, please enter a valid username.",
    EINVALIDPASWD: `Invalid password, please enter a valid password. Your password should be at least ${config.auth.activation["password-length"]} characters in length and follow the enforcement rules of there being AT LEAST\n
    1. An UPPERCASE character (Such as: ABC)\n
    2. A LOWERCASE character (Such as: abc)\n
    3. A NUMBER (Such as: 123)\n4. And a SPECIAL CHARACTER (Such as: !@#)`,
    EBADPSWD: "Please choose a different password.",
    EBADRSTTKN:
      "The link you followed does not work anymore. You need to request a password reset again.",
    ETAKEN:
      "Only one account per username and email address is allowed. And either one of these are already in use.",
    EDISABLED:
      "Your account has been disabled. Please do not create a new account. Instead, contact an administrator for assistance.",
    ENEEDSACTIVATION:
      "In order to continue, your account requires activation. Check your inbox for further instructions.",
    ENEEDSACTIVATION2:
      "Please activate your account to continue. Check your inbox for further instructions.",
    EBADAUTH: "Your username, email, or password was incorrect.",
    EBLOCKED: "Sorry, you've been blocked from our services.",
    EOOPS:
      "Oops! Looks like something went wrong on our end! Please try that again.",
    EINVALIDTIMEZONE: "Invalid timezone.",
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
    ICLAIMBONUS: `${config.server.nickname} — 🎉 Congratulations on your bonus 🎉`,
    UDETECT:
      /^(?=.{1,64}@)((?:[A-Za-z0-9!#\$%&'\*\+\-/=\?\^_`\{\|\}~]+|"(?:\\"|\\\\|[A-Za-z0-9\.!#\$%&'\*\+\-/=\?\^_`\{\|\}~ \(\),:;<>@\[\]\.])+")(?:\.(?:[A-Za-z0-9!#\$%&'\*\+\-/=\?\^_`\{\|\}~]+|"(?:\\"|\\\\|[A-Za-z0-9\.!#\$%&'\*\+\-/=\?\^_`\{\|\}~ \(\),:;<>@\[\]\.])+"))*)@(?=.{1,255}\.)((?:[A-Za-z0-9]+(?:(?:[A-Za-z0-9\-]*[A-Za-z0-9])?)\.)+[A-Za-z]{2,})|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,6}(0|)])$/,
    EBADACTOR: "Early hints—Bad actor. Please provide a different actor.",
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
    ENOTIMPLEMENTED: "This feature is not implemented yet.",
  };
  Users = {
    IDELETE: "User deleted successfully.",
    ENOTFOUND: "The specified user could not be found using the provided ID.",
    ENOTFOUND2: "That user was not found.",
    EINTERACTIONNOTFOUND: "An interaction with that user was not found.",
    EINTERACTIONISEMPTY: "Cannot send an empty message.",
    EFRIENDLYNOTFOUND:
      "Failed to find user, please make sure you didn't make any spelling errors!",
    ECANTUNSTAFFROOT: "You cannot demote the root account.",
    ECANTDELETEROOT: "You cannot delete the root account.",
    ECANTLOCKOUTROOT: "You cannot disable the root account.",
    ECANTBLOCKROOT: "You cannot restrict the root account.",
    EBADRESOURCE:
      "The resource you provided is invalid or is an unauthorized storage bucket",
    EINSUFFICIENTFUNDS: "You do not have enough funds to complete this action.",
  };
  Order = {
    EONOEXISTS: "Order not found.",
    EBADINDEX:
      "The provided index is out of range. Please provide an index that is within the acceptable range of the products array.",
    EREMOVALFAILED: "Failed to remove this item. Try that again once more.",
    IDELETE: "Order deleted successfully.",
    IREADY: "Order marked as ready and removed successfully.",
    IPDELETE: "Product deleted successfully.",
    IPMODIFY: "Product modified successfully.",
    IACCEPT: "Order accepted.",
    IOSTATUSQUEUED: "Order Queued",
    IOSTATUSACCEPTED: "Your order has been accepted for processing.",
    IOSTATUSREADYNOW: "Your order is ready now.",
    IOSTATUSDENIED:
      "Your order has been rejected. Your virtual wallet has been recredited with the amount you paid. Speak to a staff member if you would like to arrange for a withdrawal.",
    IOSTATUSDELAYED: "Your order has been delayed.",
    IOSTATUSMODIFIED: "A staff member has issued an update your order.",
    EEMPTYCART: "The shopping cart is empty",
    ENOPERMS: "You do not own this order.",
  };
  Promo = {
    ECODEEXISTS: "Promo code already exists.",
    ENICKEXISTS: "Promo nickname already exists.",
    ENOTFOUND: "Promotion not found.",
    IEXISTS: "Promotion exists.",
    IEXPIRED: "Promotion expired.",
  };
  Review = {
    ENOTFOUND: "Review not found.",
    EPRODNOEXISTS: "Product not found.",
    EUNAUTHORIZED: "You do not own this review.",
    ERANGEERROR: "Rating must be an integer between 1 and 5.",
    EASPNOEXIST: "Associated product or review does not exist.",
    IMODIFY: "Review modified successfully.",
    ICREATE: "Review created successfully.",
    WPROFFOUND:
      "Our filters detected that your review contained profane language, so was modified in order to comply with the platform's standards. <b>It was hidden from public view automatically.</b>",
  };
  Feedback = {
    ENOTFOUND: "Submission not found.",
    EUNAUTHORIZED: "You do not own this submission.",
    IMODIFY: "Submission modified successfully.",
    ICREATE: "Submission created successfully.",
    WPROFFOUND:
      "Our filters detected that your submission contained profane language, so was modified in order to comply with the platform's standards.",
  };
  Post = {
    ENOTFOUND: "Help article not found.",
    IMODIFY: "Article modified successfully.",
    ICREATE: "Article created successfully.",
  };
  Category = {
    ENOTFOUND: "Category not found.",
    EEXISTS: "Category or alias exists. Please choose another name or alias.",
  };
  Product = {
    ENOTFOUND: "Product not found.",
    EEXISTS: "A product with this slug or product name already exists.",
    EOUTOFSTOCK: "Product out of stock.",
    ETOOMANY: "Your request exceeds our maximum availability of that product.",
    ETOOLITTLE:
      "Your request is below the minimum availability of that product.",
    EBADPROMO:
      "Your request contains an invalid promo code ID. Please remove the offending code and try again.",
    ERESERVEDSLUG:
      "This slug is reserved by the system. Please choose another slug.",
  };
  Search = {
    UTOKENIZE: /[^a-zA-Z0-9]/,
    ENOENGINE:
      "No engine is readily available to service this request. Please try again later.",
  };
  Data = {
    ENOTFOUND: "Data not found.",
  };
}

const iwe_strings = new IWEU_STRINGS();
function createError(error: string) {
  return {
    message: error,
    status: false,
  };
}

function createNotification(
  title: string,
  body: string,
  channel: string,
  icon?: string,
) {
  return {
    notification: {
      title,
      body,
      icon,
    },
    topic: channel,
  };
}

export {
  createError as ErrorFormat,
  createNotification as NotifyFormat,
  iwe_strings,
};
export default iwe_strings;
