import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    console.log("BetterAuthGuard: Checking authentication for:", request.url);
    console.log("BetterAuthGuard: Request cookies:", request.cookies);
    console.log(
      "BetterAuthGuard: Authorization header:",
      request.headers.authorization,
    );

    // Get token from cookies or Authorization header
    const cookies = (request.cookies as Record<string, string>) || {};
    const sessionToken =
      cookies["better-auth.session_token"] ||
      cookies["session"] ||
      request.headers.authorization?.replace("Bearer ", "");

    console.log("BetterAuthGuard: Session token found:", !!sessionToken);
    console.log(
      "BetterAuthGuard: Token (first 20 chars):",
      sessionToken?.substring(0, 20),
    );

    if (!sessionToken) {
      console.log("BetterAuthGuard: No token provided");
      throw new UnauthorizedException("No authentication token provided");
    }

    try {
      // Verify the token
      console.log("BetterAuthGuard: Verifying token");
      const decoded = (await this.authService.verifyToken(sessionToken)) as {
        sub: string;
        exp: number;
        role?: string;
      };

      console.log("BetterAuthGuard: Token decoded successfully", {
        sub: decoded.sub,
        exp: decoded.exp,
        role: decoded.role,
      });

      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.log("BetterAuthGuard: Token expired");
        throw new UnauthorizedException("Token has expired");
      }

      // Get user data
      console.log("BetterAuthGuard: Fetching user data for ID:", decoded.sub);
      const user = await this.usersService.findUserById(decoded.sub);
      if (!user) {
        console.log("BetterAuthGuard: User not found");
        throw new UnauthorizedException("User not found");
      }

      console.log("BetterAuthGuard: User found", {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Attach user to request for use in controllers
      request.user = user;

      return true;
    } catch (error) {
      console.error("BetterAuthGuard error:", error);
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}
