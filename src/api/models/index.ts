import {
  auth_register,
  auth_verify,
  auth_login,
  auth_forgot,
  auth_reset,
} from "./Authentication";
import { user_list, user_create, user_delete, user_modify } from "./Admin/Users";
import { promo_list, promo_create, promo_delete, promo_modify } from "./Admin/Promos";
import admin_order_modify from "./Admin/Order";
import { category_list } from "./Categories";
import { category_create, category_delete, category_modify } from "./Admin/Categories";
import {
  order_list,
  order_lookup,
  order_create,
  order_delete,
  order_modify,
} from "./Order";
import { review_create } from "./Review";
import { review_delete, review_modify } from "./Admin/Reviews";
import { menu_list, menu_lookup } from "./Menu";
import { user_lookup } from "./User";
import { menu_create, menu_delete, menu_modify } from "./Admin/Menu";

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
      Modify: admin_order_modify,
    },
    Review: {
      Delete: review_delete,
      Modify: review_modify,
    },
    Menu: {
      Create: menu_create,
      Delete: menu_delete,
      Modify: menu_modify,
    },
  };

  Menu = {
    List: menu_list,
    Lookup: menu_lookup,
  };
  Category = {
    List: category_list, // Lol regular users shouldn't see this
  };
  Order = {
    List: order_list,
    Lookup: order_lookup,
    Create: order_create,
    Delete: order_delete,
    Modify: order_modify,
  };

  Review = {
    Create: review_create,
  };

  User = {
    Lookup: user_lookup, // You can surely search, but not list
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Order = api.Order;
export const Menu = api.Menu;
export const User = api.User;
export const Category = api.Category;
export const Review = api.Review;
