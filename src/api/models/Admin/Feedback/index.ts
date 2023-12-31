import { Request, Response } from "express";
// Import the feedback
import Feedback from "../../../../database/models/Feedback";
import { ErrorFormat, iwe_strings } from "../../../strings";
import what from "../../../utility/Whats";
// Generic batch request
import Filter from "bad-words";
import mongoose from "mongoose";
import settings from "../../../../config/settings.json";
import { sendEmail } from "../../../../util/email";
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array, wis_string } from "../../../utility/What_Is";
import { delete_object, list_object } from "../../../utility/batchRequest";

/***** BAD WORDS FILTER *****/
const filter = new Filter();
filter.removeWords(...settings.server.excludedBadWords); // https://www.npmjs.com/package/bad-words#remove-words-from-the-blacklist
/************************** */

async function feedback_list(req: Request, res: Response) {
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user?.staff) {
    const userFeedback = await Feedback.find({ author: user._id }).populate([
      {
        path: "author",
        model: "Users",
      },
    ]);
    return res // Some overlay permitting limited access to non-staff members. We're just giving them access to themselves (must be array)
      .json(what_is(what.private.user, userFeedback));
  }

  await list_object(req, res, Feedback, what.private.feedback, false, true, [
    {
      path: "author",
      model: "Users",
    },
  ]);
}

async function feedback_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.feedback) {
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

  // Extract information from the request body
  const content = wis_string(req);

  // verify
  const testFailed = check_values(res, content);
  if (testFailed) return;

  if (content.trim() === "")
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));

  // Create new feedback
  const newFeedback = await Feedback.create({
    // @ts-ignore
    author: user._id, // Attach it to the user
    content: filter.clean(content),
    original_content: content,
  });

  await newFeedback.save();

  // Send us a notification
  sendEmail(
    `${settings.email.username}@${settings.email.domain}`, // @ts-ignore
    `[ADMINISTRATOR]: Plattr — Feedback from ${user.username}`,
    null,
    `Hey there admin!<br/><br/>
    One of your users (@${user.username}) has submitted feedback.<br/>
    Here is what they wrote:<br/><br/>
    Content: "${newFeedback.content}"<br/>
    Original content: "${newFeedback.original_content}"<br/><br/>
    You can also view it <a href='https://cafe.ub.edu.bz/admin/dashboard/feedback#${newFeedback._id}'>here</a>.<br/>
    Also, you can reply to this email to respond to their comment.<br/><br/>
    Good luck!<br/>
    ${settings.server.nickname} Server`,
    user.email
  );
  // Return the new feedback as a JSON response
  return res.json(
    what_is(what.private.feedback, [
      filter.isProfane(content)
        ? iwe_strings.Feedback.WPROFFOUND
        : iwe_strings.Feedback.ICREATE,
      newFeedback,
    ])
  );
}

async function feedback_delete(req: Request, res: Response) {
  const feedback_id = wis_string(req);

  // Check if feedback_id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(feedback_id)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Delete the feedback
  await delete_object(
    req,
    res,
    Feedback,
    "_id",
    what.private.feedback,
    iwe_strings.Feedback.ENOTFOUND,
    false,
    undefined,
    undefined,
    false
  );
}
async function feedback_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.feedback) {
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

  // Extract information from the request body
  const [id, content] = wis_array(req);

  // verify
  const testFailed = check_values(res, content, id);
  if (testFailed) return;

  // Find the feedback by its ID
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    return res.status(404).json(ErrorFormat(iwe_strings.Feedback.ENOTFOUND));
  }

  // Is this person a staff member?
  // @ts-ignore
  if (!user.staff && !feedback.author.equals(user._id)) {
    // Give users some access too
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Feedback.EUNAUTHORIZED));
  }
  // Update the feedback's comment if they were provided

  if (content !== undefined) {
    feedback.content = filter.clean(content);
    feedback.original_content = content;
  }

  // Save the updated feedback
  await feedback.save();

  // Return the updated feedback as a JSON response
  return res.json(
    what_is(what.private.feedback, [
      filter.isProfane(content)
        ? iwe_strings.Feedback.WPROFFOUND
        : iwe_strings.Feedback.IMODIFY,
      feedback,
    ])
  );
}

function check_values(res: Response, comment: string, id?: string) {
  // Check if comment is a string
  if (typeof comment !== "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  // Check if ID is a valid string/ObjectId
  if (
    (id && typeof id != "string") ||
    (id && !mongoose.Types.ObjectId.isValid(id))
  ) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
}

export { feedback_create, feedback_delete, feedback_list, feedback_modify };
