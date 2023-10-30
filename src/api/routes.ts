import { Router } from "express"; // Our routing machine
import { Admin, Authentication, Menu, Order, User } from "./models"; // Import our API models into memory
const router = Router(); // Initialize!

// Our routes
// Authentication
router.post("/auth/signup", Authentication.Register);
router.post("/auth/verify", Authentication.Verify);
router.post("/auth/login", Authentication.Login);
router.post("/auth/passwordreset", Authentication.Request_Reset);
router.patch("/auth/passwordreset", Authentication.Reset);

// Menu
router.get("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.List(req, res);
});

router.put("/menu/search", (req: Express.Request, res: Express.Response) => {
  Menu.Lookup(req, res); // Users can lookup other menu items
});

router.delete("/menu/", (req: Express.Request, res: Express.Response) => {
  Admin.Menu.Delete(req, res);
});
router.post("/menu/", (req: Express.Request, res: Express.Response) => {
  Admin.Menu.Create(req, res);
});
router.put("/menu/", (req: Express.Request, res: Express.Response) => {
  Admin.Menu.Modify(req, res);
});

// User
router.get(
  "/user/search",
  (req: Express.Request, res: Express.Response) => {
    User.Lookup(req, res); // Users can lookup other users
  }
);
// Admin
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
router.put(
  "/admin/promo/manage",
  (req: Express.Request, res: Express.Response) => {
    Admin.Promo.Modify(req, res);
  }
);

// Order management
router.post(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
); // Accept user's order into queue
router.delete(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
); // Decline user's order into queue
router.put(
  "/admin/order/manage/",
  (req: Express.Request, res: Express.Response) => {
    Admin.Order.Modify(req, res);
  }
); // Modify user's order into queue

// Order
// Order search
router.post(
  "/order/search",
  (req: Express.Request, res: Express.Response) => {
    Order.Lookup(req, res);  // Users can lookup their orders
  }
);
// Order History. Arbitrary tokens are accepted
router.get("/order/history", (req: Express.Request, res: Express.Response) => {
  Order.List(req, res);
});

// Order placement. Arbitrary tokens are accepted
router.post("/order/place", (req: Express.Request, res: Express.Response) => {
  Order.Create(req, res);
});
router.delete("/order/place", (req: Express.Request, res: Express.Response) => {
  Order.Delete(req, res);
});

// Individual Product management

// Export our router
export default router;
