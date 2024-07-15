import { Request, Response, Router } from "express"; // Our routing machine
import * as admin from "firebase-admin";
import serviceAccount from "../config/service_account.json"; // Our service account
import settings from "../config/settings.json";
import { LogError, LogRoutes } from "../util/Logger";
import {
  Admin,
  Authentication,
  Category,
  Dash,
  Dynamic,
  Menu,
  Order,
  Promo,
  Review,
  Search,
  User,
  Data,
} from "./models"; // Import our API models into memory
import { initialize_engine as initialize_search } from "./models/Search";
let engine_2: any; // Backup engine
let engine: any; // It's going to be assigned soon, anyway.
(async () => {
  try {
    engine = await initialize_search();
  } catch (error) {
    LogError("Failed to initialize engine.");
  }
  setInterval(
    async () => {
      try {
        // Run the indexer every now and then
        engine_2 = await initialize_search();
        // Assign after waiting for the new engine to initialize
        engine = engine_2;
        // Delete the old engine
        engine_2 = null; // Garbage collection should take care of the rest
      } catch (error) {
        LogError("Failed to initialize engine.");
      }
    }, // @ts-ignore
    parseInt(settings.search["indexing-interval"]) * 1000 // In seconds
  );
})();
const router = Router(); // Initialize!
admin.initializeApp({
  // Initialize our firebase instance, as well!
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// Our <<routes>>
// <<Class API>>
// <Authentication>
router.post("/auth/signup", Authentication.Register);
router.post("/auth/verify", Authentication.Verify);
router.post("/auth/login", Authentication.Login);
router.post("/auth/passwordreset", Authentication.Request_Reset);
router.patch("/auth/passwordreset", Authentication.Reset);

// <<Admin-API>>
// <User>
router.get("/admin/user/lookup", (req: Request, res: Response) => {
  Admin.User.Find(req, res);
});
router.get("/admin/user/manage", (req: Request, res: Response) => {
  Admin.User.List(req, res);
});
router.post("/admin/user/manage", (req: Request, res: Response) => {
  Admin.User.Create(req, res);
});
router.delete("/admin/user/manage", (req: Request, res: Response) => {
  Admin.User.Delete(req, res);
});
router.put("/admin/user/manage", (req: Request, res: Response) => {
  Admin.User.Modify.default(req, res);
});
router.put(
  "/admin/user/manage/profile_picture",
  (req: Request, res: Response) => {
    Admin.User.Modify.Picture(req, res, "profile_picture");
  }
);
router.put(
  "/admin/user/manage/banner_picture",
  (req: Request, res: Response) => {
    Admin.User.Modify.Picture(req, res, "banner");
  }
);

// <Promo>
router.get("/admin/promo/manage", (req: Request, res: Response) => {
  Admin.Promo.List(req, res);
});
router.post("/admin/promo/manage", (req: Request, res: Response) => {
  Admin.Promo.Create(req, res);
});
router.delete("/admin/promo/manage", (req: Request, res: Response) => {
  Admin.Promo.Delete(req, res);
});
router.put("/admin/promo/manage", (req: Request, res: Response) => {
  Admin.Promo.Modify(req, res);
});
// <Category>
router.post("/admin/category/manage", (req: Request, res: Response) => {
  Admin.Category.Create(req, res);
});
router.delete("/admin/category/manage", (req: Request, res: Response) => {
  Admin.Category.Delete(req, res);
});
router.put("/admin/category/manage", (req: Request, res: Response) => {
  Admin.Category.Modify(req, res);
});
// <Order>
router.get("/admin/order/manage/", (req: Request, res: Response) => {
  Admin.Order.List(req, res);
});
// <Accept> user's <order> into queue
router.post("/admin/order/manage/", (req: Request, res: Response) => {
  Admin.Order.Modify(req, res);
});
// // Decline user's order into queue (superceeded by above)
// router.delete("/admin/order/manage/", (req: Request, res: Response) => {
//   Admin.Order.Modify(req, res);
// });
// // Modify user's order in queue
// router.put("/admin/order/manage/", (req: Request, res: Response) => {
//   Admin.Order.Modify(req, res);
// });
// <Review>
router.get("/admin/review/manage", (req: Request, res: Response) => {
  Admin.Review.List(req, res);
});
router.delete("/admin/review/manage", (req: Request, res: Response) => {
  Admin.Review.Delete(req, res);
});
router.put("/admin/review/manage", (req: Request, res: Response) => {
  Admin.Review.Modify(req, res);
});
// <Feedback>
router.get("/admin/feedback/manage", (req: Request, res: Response) => {
  Admin.Feedback.List(req, res);
});
router.post("/admin/feedback/manage", (req: Request, res: Response) => {
  Admin.Feedback.Create(req, res);
});
router.delete("/admin/feedback/manage", (req: Request, res: Response) => {
  Admin.Feedback.Delete(req, res);
});
router.put("/admin/feedback/manage", (req: Request, res: Response) => {
  Admin.Feedback.Modify(req, res);
});
// <Posts> (Help-center article posting)
router.get("/admin/post/lookup", (req: Request, res: Response) => {
  Admin.Post.Lookup(req, res);
});
router.get("/admin/post/manage", (req: Request, res: Response) => {
  Admin.Post.List(req, res);
});
router.post("/admin/post/manage", (req: Request, res: Response) => {
  Admin.Post.Create(req, res);
});
router.delete("/admin/post/manage", (req: Request, res: Response) => {
  Admin.Post.Delete(req, res);
});
router.put("/admin/post/manage", (req: Request, res: Response) => {
  Admin.Post.Modify(req, res);
});
// <Menu>
router.post("/admin/menu/manage", (req: Request, res: Response) => {
  Admin.Menu.Create(req, res);
});
router.delete("/admin/menu/manage", (req: Request, res: Response) => {
  Admin.Menu.Delete(req, res);
});
router.put("/admin/menu/manage", (req: Request, res: Response) => {
  Admin.Menu.Modify(req, res);
});
// <Menu/Variations>
router.post("/admin/menu/variation", (req: Request, res: Response) => {
  Admin.Menu.Variation.Create(req, res);
});
router.delete(
  "/admin/menu/variation/:variation_id",
  (req: Request, res: Response) => {
    Admin.Menu.Variation.Delete(req, res);
  }
);
router.put(
  "/admin/menu/variation/:variation_id",
  (req: Request, res: Response) => {
    Admin.Menu.Variation.Modify(req, res);
  }
);
// <Menu/Variations/Categories>
router.post("/admin/menu/variation/tag", (req: Request, res: Response) => {
  Admin.Menu.Variation.Categories.Create(req, res);
});
router.delete(
  "/admin/menu/variation/tag/:vcat_id",
  (req: Request, res: Response) => {
    Admin.Menu.Variation.Categories.Delete(req, res);
  }
);
router.put(
  "/admin/menu/variation/tag/:vcat_id",
  (req: Request, res: Response) => {
    Admin.Menu.Variation.Categories.Modify(req, res);
  }
);

// <<User-API>>
// <Dashboard>
router.get("/dash", (req: Request, res: Response) => {
  Dash.List(req, res);
});

// Dynamic extras
// <Dynamic image>
router.get("/dynamic/banner-1200-628", (req: Request, res: Response) => {
  Dynamic.Image(req, res);
});

// <Menu>
router.get("/menu/lookup", (req: Request, res: Response) => {
  Menu.Find(req, res);
});
// <Menu>
router.get("/menu/", (req: Request, res: Response) => {
  Menu.List(req, res);
});
// <Check> if a specific <item> exists
router.get("/menu/slug", (req: Request, res: Response) => {
  Menu.Slug.Exist(req, res);
});
router.get("/menu/random", (req: Request, res: Response) => {
  Menu.Random(req, res);
});

// router.get("/menu/search", (req: Request, res: Response) => {
//   Menu.Lookup(req, res); // Users can lookup other menu items
// });
// <Category>
router.get("/category/", (req: Request, res: Response) => {
  Category.List(req, res);
});
// Order
// Order History. Arbitrary tokens are accepted --- superceded by search
// router.get("/order/history", (req: Request, res: Response) => {
//   Order.List(req, res);
// });
// Users can lookup their orders
// router.get("/order/search", (req: Request, res: Response) => {
//   Order.Lookup(req, res);
// });

// Order <placement>. Arbitrary tokens are accepted
router.post("/order/place", (req: Request, res: Response) => {
  Order.Create(req, res);
});
router.delete("/order/place", (req: Request, res: Response) => {
  Order.Delete(req, res);
});
router.put("/order/place", (req: Request, res: Response) => {
  Order.Modify(req, res);
});

// <Promo> lookup. Only accessible to signed in users
router.post("/promo/validate", (req: Request, res: Response) => {
  Promo.Validate(req, res);
});

// <Review>
router.post("/review/create", (req: Request, res: Response) => {
  Review.Create(req, res);
});
// <Search>
router.get("/search", (req: Request, res: Response) => {
  Search.Lookup(req, res, engine); // Users can lookup other users
});

// User
// <What's in my cart?>
router.get("/user/cart", (req: Request, res: Response) => {
  User.Cart.List(req, res);
});
// Cart <modify>
router.post("/user/cart", (req: Request, res: Response) => {
  User.Cart.Modify(req, res);
});

// Cart <sync>
router.put("/user/cart", (req: Request, res: Response) => {
  User.Cart.Sync(req, res);
});

// Cart <delete>
router.delete("/user/cart", (req: Request, res: Response) => {
  User.Cart.Delete(req, res);
});
// <Notifications>
router.post("/user/notifications", (req: Request, res: Response) => {
  User.Notifications.Subscribe(req, res);
});
// <Messaging>
// Read messages from a specific channel
router.post("/user/messaging/get", (req: Request, res: Response) => {
  User.Messaging.Read(req, res);
});
// Send a message
router.post("/user/messaging/send", (req: Request, res: Response) => {
  User.Messaging.Send(req, res);
});
// View all interactions
router.get("/user/messaging/interactions", (req: Request, res: Response) => {
  User.Messaging.View_Interactions(req, res);
});

// Data
// <Reviews from a specific user>
router.get("/data/reviews/:user_id", (req: Request, res: Response) => {
  Data.User.Reviews.Read(req, res);
});

// Print the routes for reference
router.stack.forEach(LogRoutes.bind(null, [])); // Pass in our routes

// Export our router
export default router;
