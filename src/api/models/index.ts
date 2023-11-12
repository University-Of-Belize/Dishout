import {
  auth_register,
  auth_verify,
  auth_login,
  auth_forgot,
  auth_reset,
} from "./Authentication";
import {
  user_list,
  user_create,
  user_delete,
  user_modify,
} from "./Admin/Users";
import {
  promo_list,
  promo_create,
  promo_delete,
  promo_modify,
} from "./Admin/Promos";
import { category_list } from "./Categories";
import {
  category_create,
  category_delete,
  category_modify,
} from "./Admin/Categories";
import { order_list, order_create, order_delete, order_modify } from "./Order";
import { review_create } from "./Review";
import { review_list, review_delete, review_modify } from "./Admin/Reviews";
import { order_manage } from "./Admin/Order";
import { menu_list, menu_random, slug_exists } from "./Menu";
import { global_lookup } from "./Search";
import { cart_list, cart_modify, cart_delete } from "./User";
import { menu_create, menu_delete, menu_modify } from "./Admin/Menu";
import { dash_list } from "./Admin/Dashboard";

class API {
  Authentication = {
    Register: auth_register,
    Verify: auth_verify,
    Login: auth_login,
    Reset: auth_reset,
    Request_Reset: auth_forgot,
  };

  Admin = {
    User: {
      List: user_list,
      Create: user_create,
      Delete: user_delete,
      Modify: user_modify,
    },
    Promo: {
      List: promo_list, // Lol regular users shouldn't see this
      Create: promo_create,
      Delete: promo_delete,
      Modify: promo_modify,
    },
    Category: {
      Create: category_create,
      Delete: category_delete,
      Modify: category_modify,
    },
    Order: {
      Modify: order_manage,
    },
    Review: {
      List: review_list,
      Delete: review_delete,
      Modify: review_modify,
    },
    Menu: {
      Create: menu_create,
      Delete: menu_delete,
      Modify: menu_modify,
    },
  };
  
  Dash: {
    List: dash_list
  },
  Menu = {
    List: menu_list,
    Random: menu_random,
    // Lookup: menu_lookup,
    Slug: {
      Exist: slug_exists, // List all the slugs
    },
  };
  Category = {
    List: category_list, // Lol regular users shouldn't see this
  };
  Order = {
    List: order_list,
    // Lookup: order_lookup,
    Create: order_create,
    Delete: order_delete,
    Modify: order_modify,
  };

  Review = {
    Create: review_create,
  };

  Search = {
    Lookup: global_lookup, // You can surely search, but not list
  };
  User = {
    Cart: {
      List: cart_list, // "What's in my cart?"
      Modify: cart_modify, // "Add to cart"
      Delete: cart_delete, // Remove items from cart or empty it completely
    },
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Order = api.Order;
export const Menu = api.Menu;
export const Search = api.Search;
export const Category = api.Category;
export const Review = api.Review;
export const User = api.User;
