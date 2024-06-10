import { Request, Response } from "express";
// Import the post schema
import Post from "../../../../database/models/Posts";
import { ErrorFormat, iwe_strings } from "../../../strings";
import what from "../../../utility/Whats";
// Generic batch request
import mongoose from "mongoose";
// import settings from "../../../../config/settings.json"; // -- May need in future
import { get_authorization_user } from "../../../utility/Authentication";
import { what_is, wis_array, wis_string } from "../../../utility/What_Is";
import { delete_object, list_object } from "../../../utility/batchRequest";

async function post_lookup(req: Request, res: Response) {
  const post_to_search = req.query.article_id as string; // Post

  // verify
  const testFailed = check_values(res, "unused", post_to_search);
  if (testFailed) return;

  const post = await Post.findById(post_to_search); // Find post
  if (!post) {
    // Error if !found
    return res.status(404).json(ErrorFormat(iwe_strings.Post.ENOTFOUND));
  }

  return res.json(what_is(what.public.post, post)); // Return if found
}

async function post_list(req: Request, res: Response) {
  // const user = await get_authorization_user(req);
  // if (!user) {
  //   return res
  //     .status(403)
  //     .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  // }

  // The help center is open to everybody!

  await list_object(req, res, Post, what.public.post, true, false, [
    {
      path: "author",
      model: "Users",
    },
  ]);
}

async function post_create(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.post) {
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
    // If so, we decline them access
    return res.status(403).json(ErrorFormat(iwe_strings.Generic.ENOACCESS));
  }

  // Extract information from the request body
  const content = wis_string(req);

  // verify
  const testFailed = check_values(res, content);
  if (testFailed) return;

  if (content.trim() === "")
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));

  // Create new post
  const newPost = await Post.create({
    // @ts-ignore
    author: user._id, // Attach it to the user
    content: content,
  });

  await newPost.save();

  // Return the new post as a JSON response
  return res.json(what_is(what.private.post, newPost));
}

async function post_delete(req: Request, res: Response) {
  const post_id = wis_string(req);

  // Check if post_id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
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
    // If so, we decline them access
    return res.status(403).json(ErrorFormat(iwe_strings.Generic.ENOACCESS));
  }

  // Delete the post
  await delete_object(
    req,
    res,
    Post,
    "_id",
    what.private.post,
    iwe_strings.Post.ENOTFOUND,
    false,
    undefined,
    undefined,
    false,
  );
}
async function post_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] != what.private.post) {
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
    // If so, we decline them access
    return res.status(403).json(ErrorFormat(iwe_strings.Generic.ENOACCESS));
  }

  // Extract information from the request body
  const [id, content] = wis_array(req);

  // verify
  const testFailed = check_values(res, content, id);
  if (testFailed) return;

  // Find the post by its ID
  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json(ErrorFormat(iwe_strings.Post.ENOTFOUND));
  }
  // Update the post's comment if they were provided

  if (content !== undefined) {
    post.content = content;
  }

  // Save the updated post
  await post.save();

  // Return the updated post as a JSON response
  return res.json(what_is(what.private.post, post));
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

export { post_lookup, post_create, post_delete, post_list, post_modify };
