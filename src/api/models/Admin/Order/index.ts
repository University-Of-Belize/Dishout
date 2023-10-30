// Should handle acception, deletion and modification using what_is
// In all cases: what = "order_batchrequest"
// For acception: is[0] = "a" --> This should mark the order as accepted inside the database by activating the flag
// For deletion: is[0] = "d"
// For modification: is[0] = "m"

function order_modify(req: Express.Request, res: Express.Response){}
export default order_modify;