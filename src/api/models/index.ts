import {
  auth_register,
  auth_verify,
  auth_login,
  auth_reset,
} from "./Authentication/authentication";
import { user_list, user_create, user_modify } from "./Admin/Users/users";
import admin_order_modify from "./Admin/Order/order";
import {
  order_list,
  order_create,
  order_delete,
  order_modify,
} from "./Order/order";
import { menu_list } from "./Menu/menu";
import { menu_create, menu_delete, menu_modify } from "./Admin/Menu/menu";

class API {
  Authentication = {
    Register: auth_register,
    Verify: auth_verify,
    Login: auth_login,
    Reset: auth_reset,
  };

  Admin = {
    User: {
      List: user_list,
      Create: user_create,
      Modify: user_modify,
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
  };

  Order = {
    List: order_list,
    Create: order_create,
    Delete: order_delete,
    Modify: order_modify,
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Order = api.Order;
export const Menu = api.Menu;
