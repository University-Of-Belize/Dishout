import {
  category_create,
  category_delete,
  category_modify,
} from "./Admin/Categories";
import { menu_create, menu_delete, menu_modify } from "./Admin/Menu";
import { order_list as __order_list, order_manage } from "./Admin/Order";
import {
  promo_create,
  promo_delete,
  promo_list,
  promo_modify,
} from "./Admin/Promos";
import { review_delete, review_list, review_modify } from "./Admin/Reviews";
import { feedback_create, feedback_delete, feedback_list, feedback_modify } from "./Admin/Feedback";
import {
  user_find,
  user_create,
  user_delete,
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
import { review_create } from "./Review";
import { global_lookup } from "./Search";
import { cart_delete, cart_list, cart_modify } from "./User";

class API {
  Authentication = { // Fe: 100% support
    Register: auth_register, // Yes
    Verify: auth_verify, // Yes
    Login: auth_login, // Yes
    Reset: auth_reset, // Yes
    Request_Reset: auth_forgot, // Yes
  };

  Admin = {
    User: { // FE: 100% support
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
    Promo: { // FE: 100% support
      List: promo_list, // Lol regular users shouldn't see this -- Yes
      Create: promo_create, // Yes
      Delete: promo_delete, // Yes
      Modify: promo_modify, // Yes
    },
    Category: { // FE: 100% support
      Create: category_create, // Yes
      Delete: category_delete, // Yes
      Modify: category_modify, // Yes
    },
    Order: { // FE: 100% support
      List: __order_list, // Yes
      Modify: order_manage, // Yes
    },
    Review: { // FE: 66.667% support
      List: review_list, // Yes
      Delete: review_delete, // Yes
      Modify: review_modify, // @todo Add support for "modify reviews" in frontend
    },
    Feedback: { // @todo Add support for "feedback" in frontend (doing now)
      List: feedback_list, // Yes
      Create: feedback_create, // Yes
      Delete: feedback_delete, // Yes
      Modify: feedback_modify, // @todo feedback_modify
    },
    Menu: { // FE: 100% support
      Create: menu_create, // Yes
      Delete: menu_delete, // Yes
      Modify: menu_modify, // Yes
    },
  };
  Dash = { // FE: 100% support
    List: dash_list, // Yes
  };
  Dynamic = { // FE: 100% support
    Image: dynamic_banner, // Yes
  };
  Menu = { // FE: 100% support
    Find: menu_find, // Yes
    List: menu_list, // Yes
    Random: menu_random, // Yes
    // Lookup: menu_lookup,
    Slug: { // FE: 100% support
      Exist: slug_exists, // List all the slugs -- Yes
    },
  };
  Category = { // FE: 100% support
    List: category_list, // Lol regular users shouldn't see this -- Yes
  };
  Order = { // FE: 100% support
    List: order_list, // Yes
    // Lookup: order_lookup,
    Create: order_create, // Yes
    Delete: order_delete, // Yes
    Modify: order_modify, // Yes
  };

  Review = { // FE: 100% support
    Create: review_create, // Yes
  };

  Search = { // FE: 100% support
    Lookup: global_lookup, // You can surely search, but not list -- Yes
  };
  User = { // FE: 66.667% support
    Cart: {
      List: cart_list, // "What's in my cart?" -- Yes
      Modify: cart_modify, // "Add to cart" -- Yes
      Delete: cart_delete, // Remove items from cart or empty it completely -- Partial (50%) @todo cart_delete
    },
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Dash = api.Dash;
export const Dynamic = api.Dynamic;
export const Order = api.Order;
export const Menu = api.Menu;
export const Search = api.Search;
export const Category = api.Category;
export const Review = api.Review;
export const User = api.User;
