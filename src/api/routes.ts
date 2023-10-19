import {Router} from "express";  // Our routing machine
const router = Router(); // Initialize!
import {Authentication, Menu, Admin, Order} from "./models"  // Import our API models into memory

// Our routes
// Authentication
router.post("/auth/signup", Authentication.Register);
router.post('/auth/verify', Authentication.Verify);
router.post('/auth/login', Authentication.Login);
router.post('/auth/passwordreset', Authentication.Reset);

// Menu
router.get("/menu/", Menu.List);
router.delete("/menu/", Menu.Delete);
router.post('/menu/', Menu.Create);
router.put('/menu/', Menu.Modify);

// Admin
router.get('/admin/user/manage', Admin.User.List);
router.post('/admin/user/manage', Admin.User.Create);
router.put('/admin/user/manage', Admin.User.Modify);

// Order management
router.post('/admin/order/manage/', Admin.Order.Modify); // Accept user's order into queue
router.delete('/admin/order/manage/', Admin.Order.Modify); // Decline user's order into queue
router.put('/admin/order/manage/', Admin.Order.Modify); // Modify user's order into queue

// Order
// Order History. Arbitrary tokens are accepted
router.get('/order/history', Order.List);

// Order placement. Arbitrary tokens are accepted
router.post('/order/place', Order.Create);
router.delete('/order/place', Order.Delete);

// Individual Product management

// Export our router
export default router;