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
    const request = context.switchToHttp().getRequest();

    // Get token from cookies or Authorization header
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const cookies = (request.cookies as Record<string, string>) || {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const sessionToken =
      cookies["better-auth.session_token"] ||
      cookies["session"] ||
      request.headers.authorization?.replace("Bearer ", "");

    if (!sessionToken) {
      throw new UnauthorizedException("No authentication token provided");
    }

    try {
      // Verify the token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const decoded = (await this.authService.verifyToken(sessionToken)) as {
        sub: string;
        exp: number;
        role?: string;
      };

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
      (request as any).user = user;

      return true;
    } catch {
      throw new UnauthorizedException("Invalid authentication token");
    }
  }
}
