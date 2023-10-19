import {
  auth_register,
  auth_verify,
  auth_login,
  auth_reset,
} from "./Authentication/authentication.ts";
import { user_list, user_create, user_modify } from "./Admin/Users/users.ts";
import { order_modify } from "./Admin/Order/order.ts";
import { order_list, order_create, order_delete } from "./Order/order.ts";
import {
  menu_list,
  menu_create,
  menu_delete,
  menu_modify,
} from "./Menu/menu.ts";

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
      Modify: order_modify,
    },
  };

  Menu = {
    List: menu_list,
    Delete: menu_delete,
    Create: menu_create,
    Modify: menu_modify,
  };

  Order = {
    List: order_list,
    Create: order_create,
    Delete: order_delete,
  };
}

const api = new API();
export const Authentication = api.Authentication;
export const Admin = api.Admin;
export const Order = api.Order;
export const Menu = api.Menu;

