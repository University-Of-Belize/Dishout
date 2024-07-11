import {
  category_create,
  category_delete,
  category_modify,
} from "./Admin/Categories";
import {
  feedback_create,
  feedback_delete,
  feedback_list,
  feedback_modify,
} from "./Admin/Feedback";
import { menu_create, menu_delete, menu_modify } from "./Admin/Menu";
import { order_list as __order_list, order_manage } from "./Admin/Order";
import {
  post_create,
  post_delete,
  post_list,
  post_lookup,
  post_modify,
} from "./Admin/Posts";
import {
  promo_create,
  promo_delete,
  promo_list,
  promo_modify,
} from "./Admin/Promos";
import { review_delete, review_list, review_modify } from "./Admin/Reviews";
import {
  user_create,
  user_delete,
  user_find,
  user_list,
  user_modify,
  user_modify_picture,
} from "./Admin/Users";
import {
  auth_forgot,
  auth_login,
  auth_register,
  auth_reset,
  auth_verify,
} from "./Authentication";
import { category_list } from "./Categories";
import { dash_list } from "./Dashboard";
import { dynamic_banner } from "./Dynamic";
import { menu_find, menu_list, menu_random, slug_exists } from "./Menu";
import { order_create, order_delete, order_list, order_modify } from "./Order";
import { promo_validate } from "./Promo";
import { review_create } from "./Review";
import { global_lookup } from "./Search";
import {
  cart_delete,
  cart_list,
  cart_modify,
  cart_sync,
  notifications_subscribe,
  user_messages_read,
  user_messages_send,
  user_messages_view_interactions,
} from "./User";

import { public_data_user_reviews } from "./Data";

class API {
  Authentication = {
    // Fe: 100% support
    Register: auth_register, // Yes
    Verify: auth_verify, // Yes
    Login: auth_login, // Yes
    Reset: auth_reset, // Yes
    Request_Reset: auth_forgot, // Yes
  };

  Admin = {
    User: {
      // FE: 100% support
      Find: user_find, // Find a user by ID -- Yes
      List: user_list, // Yes
      Create: user_create, // Yes
      Delete: user_delete, // Yes
      // Modify details
      Modify: {
        default: user_modify,
        // Modify settings (soon-to-be)
        Picture: user_modify_picture,
      },
    },
    Promo: {
      // FE: 100% support
      List: promo_list, // Lol regular users shouldn't see this -- Yes
      Create: promo_create, // Yes
      Delete: promo_delete, // Yes
      Modify: promo_modify, // Yes
    },
    Category: {
      // FE: 100% support
      Create: category_create, // Yes
      Delete: category_delete, // Yes
      Modify: category_modify, // Yes
    },
    Order: {
      // FE: 100% support
      List: __order_list, // Yes
      Modify: order_manage, // Yes
    },
    Review: {
      // FE: 66.667% support
      List: review_list, // Yes
      Delete: review_delete, // Yes
      Modify: review_modify, // @todo Add support for "modify reviews" in frontend
    },
    Feedback: {
      // FE: 75% support @todo Finish support for "feedback" in frontend (doing now)
      List: feedback_list, // Yes
      Create: feedback_create, // Yes
      Delete: feedback_delete, // Yes
      Modify: feedback_modify, // @todo feedback_modify
    },
    Post: {
      // @todo Add support for "post" in frontend (doing now)
      Lookup: post_lookup, // Yes
      List: post_list, // Yes
      Create: post_create, // Yes
      Delete: post_delete, // Yes
      Modify: post_modify, // @todo feedback_modify
    },
    Menu: {
      // FE: 100% support
      Create: menu_create, // Yes
      Delete: menu_delete, // Yes
      Modify: menu_modify, // Yes
    },
  };
  Dash = {
    // FE: 100% support
    List: dash_list, // Yes
  };
  Dynamic = {
    // FE: 100% support
    Image: dynamic_banner, // Yes
  };
  Menu = {
    // FE: 100% support
    Find: menu_find, // Yes
    List: menu_list, // Yes
    Random: menu_random, // Yes
    // Lookup: menu_lookup,
    Slug: {
      // FE: 100% support
      Exist: slug_exists, // List all the slugs -- Yes
    },
  };
  Category = {
    // FE: 100% support
    List: category_list, // Lol regular users shouldn't see this -- Yes
  };
  Order = {
    // FE: 100% support
    List: order_list, // Yes
    // Lookup: order_lookup,
    Create: order_create, // Yes
    Delete: order_delete, // Yes
    Modify: order_modify, // Yes
  };

  Promo = {
    // FE: 100% support
    Validate: promo_validate, // Yes
  };

  Review = {
    // FE: 100% support
    Create: review_create, // Yes
  };

  Search = {
    // FE: 100% support
    Lookup: global_lookup, // You can surely search, but not list -- Yes
  };
  User = {
    // FE: 66.667% support
    Cart: {
      List: cart_list, // "What's in my cart?" -- Yes
      Modify: cart_modify, // "Add to cart" -- Yes
      Sync: cart_sync, // "Sync cart" -- Yes
      Delete: cart_delete, // Remove items from cart or empty it completely -- Partial (50%) @todo cart_delete
    },
    Notifications: {
      Subscribe: notifications_subscribe,
    },
    Messaging: {
      Read: user_messages_read,
      Send: user_messages_send,
      View_Interactions: user_messages_view_interactions,
    },
  };
  Data = {
    User: {
      Reviews: {
        Read: public_data_user_reviews,
      },
    },
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Dash = api.Dash;
export const Dynamic = api.Dynamic;
export const Order = api.Order;
export const Promo = api.Promo;
export const Menu = api.Menu;
export const Search = api.Search;
export const Category = api.Category;
export const Review = api.Review;
export const User = api.User;
export const Data = api.Data;
