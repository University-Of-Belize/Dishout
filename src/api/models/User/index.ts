import { Request, Response } from "express";
// Add to the cart
// Note (unrelated to API): Frontend groups array of productIds
// This function should: Take in the user's cart as an array in "is" and user.cart.push(productId);
function cart_modify(req: Request, res: Response){}

// Remove from the cart or empty it completely
/*
what: "user",
is: null // Delete the entire cart


what: "user",
is: string // remove something from the cart

*/
function cart_delete(req: Request, res: Response){}

export { cart_delete, cart_modify };
