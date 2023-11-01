// Should handle acception, deletion and modification using what_is
// In all cases: what = "order_batchrequest"
// In all cases: is[1] = Order_id
// For acception: is[0] = "a" --> This should mark the order as accepted inside the database by activating the flag --- send email to user "Accepted"
// For deletion: is[0] = "d"  -- Send email to user "Declined"
// For modification: is[0] = "m"  -- Send email to user "Overriden"

import { Request, Response } from "express";
import Order from "../..../database/models/Order";

async function order_manage(req: Request, res: Response) {
    // Extract the action and order ID from the request body
    const { action, orderId } = req.body;

    // Find the order by its ID
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: "Order not found." });
    }

    // Handle the different actions
    switch (action) {
        case 'a': // Accept the order
            order.accepted = true;
            break;
        case 'd': // Delete the order
            await Order.findByIdAndDelete(orderId);
            return res.status(200).json({ message: 'Order deleted successfully.' });
        case 'm': // Modify the order
            // Here you would handle the modifications to the order
            // This will depend on what fields of the order you want to allow modifying
            break;
        default:
            return res.status(400).json({ message: 'Invalid action.' });
    }

    // Save the updated order
    await order.save();

    // Return the updated order as a JSON response
    return res.json(order);
}
export {order_manage};