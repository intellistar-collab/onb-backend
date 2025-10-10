import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "./role.enum";

// Define user interface to avoid 'any' type warnings
interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      "roles",
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user: AuthenticatedUser = request.user;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException("You do not have permission");
    }
    return requiredRoles.includes(user.role);
  }
}
