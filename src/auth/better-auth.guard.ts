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
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    // Get token from cookies or Authorization header
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const cookies = (request.cookies as Record<string, string>) || {};
    const sessionToken =
      cookies["better-auth.session_token"] ||
      cookies["session"] ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request.headers.authorization as string)?.replace("Bearer ", "");

    console.log("BetterAuthGuard: Available cookies:", Object.keys(cookies));
    console.log(
      "BetterAuthGuard: Authorization header:",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.headers.authorization as string,
    );
    console.log("BetterAuthGuard: Session token found:", !!sessionToken);

    if (!sessionToken) {
      throw new UnauthorizedException("No authentication token provided");
    }

    try {
      // Debug logging
      console.log(
        "BetterAuthGuard: Verifying token:",
        sessionToken?.substring(0, 20) + "...",
      );

      // Verify the token
      const decoded = (await this.authService.verifyToken(sessionToken)) as {
        sub: string;
        exp: number;
        role?: string;
      };

      console.log("BetterAuthGuard: Token decoded successfully:", {
        sub: decoded.sub,
        exp: decoded.exp,
      });

      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new UnauthorizedException("Token has expired");
      }

      // Get user data
      const user = await this.usersService.findUserById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Attach user to request for use in controllers
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request.user = user;

      return true;
    } catch (error) {
      console.error("BetterAuthGuard: Token verification failed:", error);
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}
