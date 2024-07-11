import { Request, Response } from "express";
import { menu_random_internal } from "../Menu";

async function dynamic_banner(req: Request, res: Response) {
  const random_item_data = await menu_random_internal(1);
  const item = random_item_data.is[0] ?? {
    image: "https://ubcafe.ub.edu.bz/placeholder/product.png",
  };
  // Return the data that the providing URL in item.image provides
  return res.redirect(item.image);
}

export { dynamic_banner };
