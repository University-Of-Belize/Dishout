import User from "../../database/models/Users";
import { Request } from "express";

type AuthorizationToken = string | null;

// Get the header, return the token
function get_authorization(req: Request): AuthorizationToken {
  const authHeader = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring(7)
    : null;
  return authHeader ?? null;
}

// Get the header, return the user
async function get_authorization_user(
  req: Request,
): Promise<typeof User | null> {
  const token: AuthorizationToken = get_authorization(req);

  if (token) {
    // @ts-ignore
    const user: typeof User = await User.findOne({ token });
    return user ?? null;
  }
  return null;
}

export { get_authorization, get_authorization_user };
