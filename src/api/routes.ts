import { Router } from "express"; // Our routing machine
import { Admin, Authentication, Menu, Order } from "./models"; // Import our API models into memory
const router = Router(); // Initialize!

// Our routes
// Authentication
router.post("/auth/signup", Authentication.Register);
router.post("/auth/verify", Authentication.Verify);
router.post("/auth/login", Authentication.Login);
router.post("/auth/passwordreset", Authentication.Reset);

// Menu
router.get("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.List(req, res);
});

router.delete("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.Delete(req, res);
});
router.post("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.Create(req, res);
});
router.put("/menu/", (req: Express.Request, res: Express.Response) => {
  Menu.Modify(req, res);
});

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
