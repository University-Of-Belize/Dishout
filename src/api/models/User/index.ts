import { Request, Response } from "express";
import * as admin from "firebase-admin";
import mongoose from "mongoose";
import settings from "../../../config/settings.json";
import Category from "../../../database/models/Categories";
import type { ServerMessage } from "../../../database/models/Messages";
import Messages from "../../../database/models/Messages";
import Order from "../../../database/models/Orders";
import Product from "../../../database/models/Products";
import ProductResearch from "../../../database/models/research/ProductData";
import Users from "../../../database/models/Users";
import { ErrorFormat, iwe_strings } from "../../strings";
import { get_authorization_user } from "../../utility/Authentication";
import { what_is, wis_array, wis_obj, wis_string } from "../../utility/What_Is";
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
  const [item, quantity, variation_ids] = wis_array(req);

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
  if (typeof variation_ids !== "object" || !Array.isArray(variation_ids)) {
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

  // Check to see if the product is already in the cart
  // @ts-expect-error We want to find the product in the cart
  const cart_item = user.cart.find(
    (item) => item.product._id.toString() == product._id.toString()
  );

  // If it is, increase the quantity
  // @follow-up This math is buggy
  if (cart_item) {
    // Decrease the quantity of the product
    product.in_stock += cart_item.quantity;
    product.in_stock -= quantity;
    // In the above statement, we're adding the previous quantity and subtracting the new quantity
    // To make sense of this, we're adding the previous quantity back to the stock and then subtracting the new quantity

    // Finally, set the new quantity
    cart_item.quantity = quantity;

    if (variation_ids.length > 0) {
      cart_item.variations = variation_ids;
    }
  } else {
    // If this is a new item, decrease the quantity
    product.in_stock -= quantity;

    // Populate the cart with the product
    // @ts-expect-error The cart is an array of objects
    user.cart.push({
      product: product._id,
      quantity: quantity,
      variations: variation_ids,
    });
    productresearch.carted += 1;
  }
  // Save and return
  // @ts-expect-error Save the product and user
  await user.save();
  await product.save();
  await productresearch.save();
  res.json(what_is(what.public.user, product));
}

// Sync the cart with the client
async function cart_sync(req: Request, res: Response) {
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
  const productArray = wis_array(req);
  // Repopulate the user's cart
  try {
    // @ts-expect-error Empty the user's cart
    user.cart = [];
    const checks = productArray.map(async (item) => {
      // Check if this is a valid MongoDB ID
      if (!mongoose.Types.ObjectId.isValid(item.product._id)) {
        return -1;
      }

      // Check if the product exists
      const product = await Product.findById(item.product._id);
      if (!product) {
        return -1;
      }

      // @ts-expect-error The cart is an array of objects
      user.cart.push({
        product,
        quantity: item.quantity,
        variations: item.variations,
      });
    });

    const error_message = (await Promise.all(checks)).some(
      (result) => result === -1
    )
      ? res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS))
      : null;
    if (error_message) return error_message;
    // if (cart_error == true) {
    //   return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
    // }
    // Save and return
    // @ts-expect-error The user object is being modified
    await user.save();
    return res.json({ status: true });
  } catch (error) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
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

  const message_obj: ServerMessage = wis_obj(req);
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
            ? settings.server.nickname
            : //`Message from @${user.username.toLowerCase()}`
              `${settings.server.nickname} - ${new_message.subject}`,
        body: `${user.username}: ${new_message.content as string}`,
        image: user.profile_picture,
      },
      topic: to_user.channel_id,
    });
  } catch (error) {
    console.warn("Could not push message to user. Error: ", error);
  }

  await new_message.save();

  // Create the message response
  const message_response: ServerMessage = {
    _id: new_message._id.toString(),
    subject: new_message.subject as string,
    content: new_message.content as string,
    from_user: {
      username: user.username,
      channel_id: user.channel_id,
      profile_picture: user.profile_picture,
      banner: user.banner,
    },
    to_user: {
      username: to_user.username,
      channel_id: to_user.channel_id,
      profile_picture: to_user.profile_picture,
      banner: to_user.banner,
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
  const user_id = mongoose.Types.ObjectId.createFromHexString(
    user._id.toString()
  );
  const to_user_id = mongoose.Types.ObjectId.createFromHexString(
    to_user._id.toString()
  );
  const message_response = await Messages.aggregate([
    {
      $match: {
        $or: [
          // I want messages sent FROM MYSELF TO AN ENDPOINT
          // or sent FROM AN ENDPOINT TO MYSELF
          { from_user_id: user_id, to_user_id: to_user_id },
          { from_user_id: to_user_id, to_user_id: user_id },
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
    {
      $match: {
        to_user_id: mongoose.Types.ObjectId.createFromHexString(
          user._id.toString()
        ),
      },
    },
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

// Modify a user's credit balance
async function user_credit_modify(req: Request, res: Response) {
  // Check our 'what_is'
  if (req.body["what"] !== what.private.user) {
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

  // @ts-expect-error Dumb schemas have issues
  if (!user.staff) {
    return res
      .status(403)
      .json(ErrorFormat(iwe_strings.Authentication.ENOACCESS));
  }

  // Get the credit balance to modify
  const [user_username, credit_balance] = wis_array(req);
  const user_to_modify = await Users.findOne({ username: user_username });

  // Reject if credit_balance is not a number
  if (isNaN(credit_balance)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Reject if credit_balance is above a 32-bit integer
  if (credit_balance > 2147483647) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  if (!user_to_modify) {
    return res.status(404).json(ErrorFormat(iwe_strings.Users.ENOTFOUND));
  }

  if (credit_balance == "") {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }

  // Modify the user's credit balance
  const newBalance =
    parseFloat(user_to_modify.credit) + parseFloat(credit_balance);

  // Check if newBalance is 'NaN'
  if (isNaN(newBalance)) {
    return res.status(400).json(ErrorFormat(iwe_strings.Generic.EBADPARAMS));
  }
  if (newBalance < 0) {
    return res
      .status(400)
      .json(ErrorFormat(iwe_strings.Users.Credit.ENEGATIVEBALANCE));
  }

  user_to_modify.credit = newBalance;
  await user_to_modify.save();

  // Create a new order
  // Check to see if the "credit-refill" product exists
  let credit_refill_product = await Product.findOne({ slug: "credit-refill" });

  // If the product doesn't exist, create it
  if (!credit_refill_product) {
    const new_credit_refill_category = await Category.create({
      name: "Credit Refill",
      description:
        "Refill your credit balance. This category is system-generated.",
      alias: "credit-refill",
      hidden: true,
    });

    const new_credit_refill_product = await Product.create({
      slug: "credit-refill",
      productName: "Credit Refill",
      price: 0,
      in_stock: 0,
      description:
        "Refill your credit balance. This product is system-generated.",
      category: new_credit_refill_category, // This is a dummy category
      keywords: ["credit", "refill"],
    });

    await new_credit_refill_category.save();
    await new_credit_refill_product.save();

    // Update the credit_refill_product
    credit_refill_product = new_credit_refill_product;
  }

  const new_order = await Order.create({
    order_code: "CREDITREFILL" + Date.now(),
    order_date: Math.floor(Date.now() / 1000),
    order_from: user_to_modify,
    products: [
      {
        product: credit_refill_product,
        quantity: 1,
        variations: [],
      },
    ],
    total_amount: credit_balance,
    final_amount: credit_balance,
    discount_amount: 0,
    completed: true, // Automatically complete the order--this turns the order into a receipt
  });

  // Send a notification to the user that their balance has been updated accordingly
  await admin.messaging().send({
    notification: {
      title: `${settings.server.nickname} - Credit Refill`,
      body: `Your credit balance has been updated by ${credit_balance}. Your new balance is ${newBalance}.`,
    },
    topic: user_to_modify.channel_id,
  });

  // Save the order
  await new_order.save();

  return res.json(what_is(what.private.user, user_to_modify));
}

export {
  cart_delete,
  cart_list,
  cart_modify,
  cart_sync,
  notifications_subscribe,
  user_credit_modify,
  user_messages_read,
  user_messages_send,
  user_messages_view_interactions
};

