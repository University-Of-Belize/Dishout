import {
  auth_register,
  auth_verify,
  auth_login,
  auth_forgot,
  auth_reset,
} from "./Authentication";
import { user_list, user_create, user_modify } from "./Admin/Users";
import { promo_list, promo_create, promo_modify } from "./Admin/Promos";
import admin_order_modify from "./Admin/Order";
import {
  order_list,
  order_lookup,
  order_create,
  order_delete,
  order_modify,
} from "./Order";
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
      Modify: user_modify,
    },
    Promo: {
      List: promo_list,  // Lol regular users shouldn't see this
      Create: promo_create,
      Modify: promo_modify,
    },
    Order: {
      Modify: admin_order_modify,
    },
    Menu: {
      Delete: menu_delete,
      Create: menu_create,
      Modify: menu_modify,
    },
  };

  Menu = {
    List: menu_list,
    Lookup: menu_lookup,
  };

  Order = {
    List: order_list,
    Lookup: order_lookup,
    Create: order_create,
    Delete: order_delete,
    Modify: order_modify,
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
