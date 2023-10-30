import { Router } from "express"; // Our routing machine
import { Admin, Authentication, Menu, Order, User, Category, Review } from "./models"; // Import our API models into memory
import { LogRoutes } from "../util/Logger";
const router = Router(); // Initialize!

// Our routes
// Class API
// Authentication
router.post("/auth/signup", Authentication.Register);
router.post("/auth/verify", Authentication.Verify);
router.post("/auth/login", Authentication.Login);
router.post("/auth/passwordreset", Authentication.Request_Reset);
router.patch("/auth/passwordreset", Authentication.Reset);

// Admin-API
// User
router.get(
  "/admin/user/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.User.List(req, res);
  }
);
router.post(
  "/admin/user/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.User.Create(req, res);
  }
);
router.delete(
  "/admin/user/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.User.Delete(req, res);
  }
);
router.put(
  "/admin/user/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.User.Modify(req, res);
  }
);

// Promo
router.get(
  "/admin/promo/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Promo.List(req, res);
  }
);
router.post(
  "/admin/promo/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Promo.Create(req, res);
  }
);
router.delete(
  "/admin/promo/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Promo.Delete(req, res);
  }
);
router.put(
  "/admin/promo/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Promo.Modify(req, res);
  }
);
// Category
router.post(
  "/admin/category/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Category.Create(req, res);
  }
);
router.delete(
  "/admin/category/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Category.Delete(req, res);
  }
);
router.put(
  "/admin/category/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Category.Modify(req, res);
  }
);
// Order
// Accept user's order into queue
router.post(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
);
// Decline user's order into queue
router.delete(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
);
// Modify user's order in queue
router.put(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
);
// Review
router.delete(
  "/admin/review/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Menu.Delete(req, res);
  }
);
router.put(
  "/admin/review/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Menu.Modify(req, res);
  }
);
// Menu
router.post(
  "/admin/menu/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Menu.Create(req, res);
  }
);
router.delete(
  "/admin/menu/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Menu.Delete(req, res);
  }
);
router.put(
  "/admin/menu/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Menu.Modify(req, res);
  }
);

// User-API
// Menu
router.get("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.List(req, res);
});

router.get("/menu/search", (req: Express.Request, res: Express.Response) => {
  Menu.Lookup(req, res); // Users can lookup other menu items
});
// Category
router.get("/category/", (req: Express.Request, res: Express.Response) => {
  Category.List(req, res);
});
// Order
// Order History. Arbitrary tokens are accepted
router.get("/order/history", (req: Express.Request, res: Express.Response) => {
  Order.List(req, res);
});
// Users can lookup their orders
router.get("/order/search", (req: Express.Request, res: Express.Response) => {
  Order.Lookup(req, res); 
});

// Order placement. Arbitrary tokens are accepted
router.post("/order/place", (req: Express.Request, res: Express.Response) => {
  Order.Create(req, res);
});
router.delete("/order/place", (req: Express.Request, res: Express.Response) => {
  Order.Delete(req, res);
});
router.put("/order/place", (req: Express.Request, res: Express.Response) => {
  Order.Modify(req, res);
});

// Review
router.post("/review/create", (req: Express.Request, res: Express.Response) => {
  Review.Create(req, res);
});
// User
router.get("/user/search", (req: Express.Request, res: Express.Response) => {
  User.Lookup(req, res); // Users can lookup other users
});

// Print the routes for reference
router.stack.forEach(LogRoutes.bind(null, [])); // Pass in our routes

// Export our router
export default router;
