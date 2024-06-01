import { Request, Response } from "express";
import * as admin from "firebase-admin";
import mongoose from "mongoose";
import Users from "../../../database/models/Users";
import Messages from "../../../database/models/Messages";
import type { Message } from "../../../database/models/Messages";
import Product from "../../../database/models/Products";
import ProductResearch from "../../../database/models/research/ProductData";
import settings from "../../../config/settings.json";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { what_is, wis_array, wis_string, wis_obj } from "../../utility/What_Is";
import what from "../../utility/Whats";
// Add to the cart
// Note (unrelated to API): Frontend groups array of productIds
// This function should: Take in the user's cart as an array in "is" and user.cart.push(productId);
async function cart_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
    // Two underscores means it's an admin function
    return res.status(400).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Value check. Does this belong here?
  const [item, quantity] = wis_array(req);

  let product;
  let productresearch;
  // Check if ID is a valid string/ObjectId
  if (typeof item != "string") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (!mongoose.Types.ObjectId.isValid(item)) {
    product = await Product.findOne({ slug: item });
  } else {
    product = await Product.findById(item);
  }
  if (!quantity || typeof quantity != "number") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  // Does this product even exist?
  if (!product) {
    return res.status(400).json(ErrorFormat(iwe_strings.Product.ENOTFOUND));
  }

  // Decrease the quantity by how much we ordered. If there's to little give an error
  if (product.in_stock == 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Product.EOUTOFSTOCK));
  }
  if (product.in_stock - quantity < 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Product.ETOOMANY));
  }
  if (quantity < 0) {
    return res.status(406).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Data to track
  productresearch = await ProductResearch.findOne({ product });
  if (!productresearch) {
    productresearch = await ProductResearch.create({ product });
  }

  // Decrease the quantity
  product.in_stock = product.in_stock - quantity;

  // Populate the cart with the product
  // @ts-ignore
  user.cart.push({ product: product._id, quantity: quantity });
  productresearch.carted += 1;
  // Save and return
  // @ts-ignore
  await user.save();
  await product.save();
  await productresearch.save();
  res.json(what_is(what.public.user, product));
}

// Remove from the cart or empty it completely
/*
@Note Couldn't get it to accept both real integers and string integers. Built diff I guess

what: "user",
is: null // Delete the entire cart


what: "user",
is: string // remove something from the cart

*/
// @remind Add 'uncarted' research
async function cart_delete(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
    // Two underscores means it's an admin function
    return res.status(400).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Value check. Answers the question: Does this belong here?
  let item_index: number | string = wis_string(req); // Using 'let' because, we'll modify this later

  // Check if item_index is undefined or not a valid number
  if (Number.isNaN(item_index) && wis_string(req) !== undefined) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // If null then that means we want to empty the cart
  if (item_index == undefined || item_index == "") {
    // Go through the cart, putting back the items
    // @ts-ignore
    // let totalQuantity = 0;
    // let cart_product;

    // Loop through all of the products and get all the quanities for each item while putting them back
    // @ts-ignore
    // for (const product of user.cart) {
    //   cart_product = await Product.findById(product.product);
    //   if (cart_product) {
    //     cart_product.in_stock = cart_product.in_stock + product.quantity;
    //     console.log(cart_product.in_stock);
    //     await cart_product.save();
    //   }
    // }

    // [OPTIMIZED]: Create an array of product ids and their quantities
    const productUpdates = user.cart.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { in_stock: item.quantity } },
      },
    }));

    // Update all products in one go
    await Product.bulkWrite(productUpdates);

    // Empty the cart
    // @ts-ignore
    user.cart = undefined;
    // @ts-ignore
    user.save();
    return res.json({ status: true });
  }

  // Parse the integer
  item_index = parseInt(item_index);

  // @ts-ignore
  if (item_index < 0 || item_index > user.cart.length - 1) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Put back the item
  // @ts-ignore
  const item_to_putback = await Product.findById(user.cart[item_index].product);
  // Weird
  if (!item_to_putback) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  // Remove item from the cart by index
  // @ts-ignore
  user.cart.splice(item_index, 1);

  // Save and return
  // @ts-ignore
  user.save();
  res.json({ status: true });
}

// Not using the function "delete_object" here, because, it's different.
async function cart_list(req: Request, res: Response) {
  // Check our authentication token and see if it matches up to a staff member
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Populate the "product" field in the cart
  // @ts-ignore
  await user.populate({
    path: "cart.product",
    model: "Products",
  });

  // @ts-ignore
  return res.json(what_is(what.public.user, user.cart));
}

// Firebase push notifications
async function notifications_subscribe(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
    // Two underscores means it's an admin function
    return res.status(400).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a user
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Get the device token
  const token = wis_string(req);
  // Subscribe to the topic
  await admin
    .messaging() // @ts-ignore
    .subscribeToTopic(token, user.channel_id)
    .then(async function (response) {
      if (response.failureCount > 0) {
        return res
          .status(500) // Return any errors, if necessary
          .json(ErrorFormat(JSON.stringify(response.errors)));
      }

      // Test scenario @remind Remove after some time ------------------------------------------------------------------
      // @ts-ignore
      if (!user.firstAlert) {
        await admin.messaging().send({
          notification: {
            title: settings.server.nickname,
            body: "Alerts will look like this.",
          }, // @ts-ignore
          topic: user.channel_id,
        });
        // ----- Update the user data ------- //
        // @ts-ignore
        user.firstAlert = true; // @ts-ignore
        await user.save();
        // ------------------------------------------------------- //
      }
      // Return true if everything's 'ok'
      return res.json({ status: true });
    });
}

// Send messages to another user's FCM channel
/**
 * {
 * what: 'user',
 * is: {
 *   user: 'alexdev404',
 *   message: {
 *     subject: 'Hi',
 *     content: 'This is the message content.'
 *    }
 *  }
 * }
 */
async function user_messages_send(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
    // This is a public function
    return res.status(400).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a user
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  const message_obj: Message = wis_obj(req);
  if (message_obj == null) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  const to_user = await Users.findOne({ username: message_obj.user });
  if (to_user == null) {
    return res.status(400).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
  }
  // console.log(message_obj, !message_obj.message, !message_obj.message.subject, !message_obj.message.content);
  if (
    message_obj.message === null ||
    message_obj.message.subject === null ||
    message_obj.message.content === null
  ) {
    return res
      .status(400)
      .json(ErrorFormat(iwe_strings.Users.EINTERACTIONISEMPTY));
  }

  if (
    // message_obj.message.subject.trim() === "" ||
    message_obj.message.content.trim() === ""
  ) {
    return res
      .status(400)
      .json(ErrorFormat(iwe_strings.Users.EINTERACTIONISEMPTY));
  }

  // We have the two users now. Write to the database.
  // await user.populate({
  //   path: "cart.product",
  //   model: "Products",
  // });

  const new_message = await Messages.create({
    from_user_id: user,
    to_user_id: to_user,
    subject: message_obj.message.subject,
    content: message_obj.message.content,
  });

  if (new_message == null) {
    return res
      .status(500)
      .json(ErrorFormat(iwe_strings.Generic.EINTERNALERROR));
  }

  // Try to send the message to the user
  try {
    await admin.messaging().send({
      notification: {
        title:
          message_obj.message.subject.trim() === ""
            ? `Message from @${user.username.toLowerCase()}`
            : new_message.subject,
        body: new_message.content as string,
      },
      topic: to_user.channel_id,
    });
  } catch (error) {
    console.warn("Could not push message to user. Error: ", error);
  }

  await new_message.save();

  // Create the message response
  const message_response: Message = {
    user: to_user.username,
    message: {
      subject: new_message.subject as string,
      content: new_message.content as string,
    },
  };

  return res.json(what_is(what.public.user, message_response));
}

/**
 * REQUEST
 * ===
 * {
 * what: 'user',
 * is: "CHANNEL_ID"
 *
 * }
 *
 * RESPONSE
 * =====
 * {
 * what: 'user',
 * is: [
 * {
 *   user: 'alexdev404',
 *   message: {
 *     subject: 'Hi',
 *     content: 'This is the message content.'
 *    }
 *  }
 * },
 * {
 *   user: 'alexdev404',
 *   message: {
 *     subject: 'Hi',
 *     content: 'This is the message content.'
 *    }
 *  }
 * }
 * ]
 */
async function user_messages_read(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.public.user) {
    // This is a public function
    return res.status(400).send(ErrorFormat(iwe_strings.Generic.EFOLLOWRULES));
  }

  // Check our authentication token and see if it matches up to a user
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // Get the channel ID we will be reading from
  const channel_id = wis_string(req);
  if (channel_id == "") {
    return res.status(404).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Attempt to retrieve a user with this channel ID
  const to_user = await Users.findOne({ channel_id });
  if (to_user == null) {
    return res
      .status(400)
      .json(ErrorFormat(iwe_strings.Users.EINTERACTIONNOTFOUND));
  }

  // We should have the users now
  // Return all messages from the database
  const message_response = await Messages.aggregate([
    {
      $match: {
        $or: [
          // I want messages sent FROM MYSELF TO AN ENDPOINT
          // or sent FROM AN ENDPOINT TO MYSELF
          { from_user_id: user._id, to_user_id: to_user._id },
          { from_user_id: to_user._id, to_user_id: user._id },
        ],
      },
    }, // Filter messages from a specific user
    {
      $lookup: {
        from: "users", // Join with the 'users' collection
        localField: "to_user_id", // Match 'to_user_id' in 'Messages' with '_id' in 'Users'
        foreignField: "_id",
        as: "to_user_", // Store matched user documents in 'to_user'
      },
    },
    { $unwind: "$to_user_" }, // Deconstruct 'to_user' array to a single object
    {
      $lookup: {
        from: "users", // Join with the 'users' collection
        localField: "from_user_id", // Match 'from_user_id' in 'Messages' with '_id' in 'Users'
        foreignField: "_id",
        as: "from_user_", // Store matched user documents in 'from_user'
      },
    },
    { $unwind: "$from_user_" }, // Deconstruct 'from_user' array to a single object
    {
      $project: {
        from_user_id: 0, // Exclude 'from_user_id' field
        __v: 0, // Exclude '__v' field
        to_user_id: 0, // Exclude original 'to_user_id' field
      },
    },
    {
      $addFields: {
        // From user
        "from_user.username": "$from_user_.username",
        "from_user.channel_id": "$from_user_.channel_id",
        "from_user.profile_picture": "$from_user_.profile_picture",
        "from_user.banner": "$from_user_.banner",

        // To user
        "to_user.username": "$to_user_.username",
        "to_user.channel_id": "$to_user_.channel_id",
        "to_user.profile_picture": "$to_user_.profile_picture",
        "to_user.banner": "$to_user_.banner",
      },
    }, // Add new 'to_user_id' field with value from 'to_user.username'
    { $project: { from_user_: 0, to_user_: 0 } }, // Remove the generated 'from_user_' and 'to_user_' field
  ]); // Umm, thanks ChatGPT?
  return res.json(what_is(what.public.user, message_response));
}

// Retrieve all interactions
// [GET]: Does NOT require the _what_is_ format
async function user_messages_view_interactions(req: Request, res: Response) {
  // Check our authentication token and see if it matches up to a user
  const user = await get_authorization_user(req);
  if (!user) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.EBADAUTH));
  }

  // We should have the users now
  // Return all messages from the database
  const message_response = await Messages.aggregate([
    // I want ALL messages sent TO MYSELF
    { $match: { to_user_id: user._id } },
    {
      $lookup: {
        from: "users", // Join with the 'users' collection
        localField: "to_user_id", // Match 'to_user_id' in 'Messages' with '_id' in 'Users'
        foreignField: "_id",
        as: "to_user_", // Store matched user documents in 'to_user'
      },
    },
    { $unwind: "$to_user_" }, // Deconstruct 'to_user' array to a single object
    {
      $lookup: {
        from: "users", // Join with the 'users' collection
        localField: "from_user_id", // Match 'from_user_id' in 'Messages' with '_id' in 'Users'
        foreignField: "_id",
        as: "from_user_", // Store matched user documents in 'from_user'
      },
    },
    { $unwind: "$from_user_" }, // Deconstruct 'from_user' array to a single object
    {
      $project: {
        from_user_id: 0, // Exclude 'from_user_id' field
        __v: 0, // Exclude '__v' field
        to_user_id: 0, // Exclude original 'to_user_id' field
      },
    },
    {
      $addFields: {
        // From user
        "from_user.username": "$from_user_.username",
        "from_user.channel_id": "$from_user_.channel_id",
        "from_user.profile_picture": "$from_user_.profile_picture",
        "from_user.banner": "$from_user_.banner",

        // To user
        "to_user.username": "$to_user_.username",
        "to_user.channel_id": "$to_user_.channel_id",
        "to_user.profile_picture": "$to_user_.profile_picture",
        "to_user.banner": "$to_user_.banner",
      },
    }, // Add new 'to_user_id' field with value from 'to_user.username'
    { $project: { from_user_: 0, to_user_: 0 } }, // Remove the generated 'from_user_' and 'to_user_' field
  ]); // Umm, thanks ChatGPT?

  return res.json(what_is(what.public.user, message_response));
}

export {
  cart_delete,
  cart_list,
  cart_modify,
  notifications_subscribe,
  user_messages_read,
  user_messages_send,
  user_messages_view_interactions,
};
