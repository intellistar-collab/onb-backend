import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

// Types
interface SignUpRequest {
  email: string;
  password: string;
  username?: string;
}

interface SignInRequest {
  email: string;
  password: string;
}

interface TokenPayload {
  sub: string;
  role: string;
  exp?: number;
}

interface BetterAuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BetterAuthSession {
  token: string;
  expiresAt: Date;
}

interface BetterAuthResponse {
  user: BetterAuthUser;
  session: BetterAuthSession | null;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Constants
const SESSION_COOKIE_NAME = "better-auth.session_token";
const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

@Controller("api/auth")
export class BetterAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private isHttps(): boolean {
    return (process.env.FRONTEND_URL || "").startsWith("https");
  }

  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isHttps(),
      sameSite: this.isHttps() ? ("none" as const) : ("lax" as const),
      maxAge: TOKEN_EXPIRY_MS,
      path: "/",
      // Don't set domain for localhost, only for production domains
      domain: this.isHttps() && !this.isLocalhost() ? ".render.com" : undefined,
    };
  }

  private isLocalhost(): boolean {
    return (
      process.env.NODE_ENV === "development" ||
      (process.env.FRONTEND_URL?.includes("localhost") ?? false) ||
      (process.env.FRONTEND_URL?.includes("127.0.0.1") ?? false)
    );
  }

  private extractToken(req: Request): string | null {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      return authHeader.replace("Bearer ", "");
    }

    // Fallback to cookie
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[SESSION_COOKIE_NAME] || null;
  }

  private createUserResponse(user: any): BetterAuthUser {
    const userData = user as UserData;
    return {
      id: userData.id || "",
      email: userData.email || "",
      username: userData.username || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      role: userData.role || "USER",
      avatar: userData.avatar || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    };
  }

  private createSessionResponse(
    token: string,
    expiresAt?: Date,
  ): BetterAuthSession {
    return {
      token,
      expiresAt: expiresAt || new Date(Date.now() + TOKEN_EXPIRY_MS),
    };
  }

  private handleError(
    error: unknown,
    defaultMessage: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ): never {
    const message = error instanceof Error ? error.message : defaultMessage;
    throw new HttpException({ message }, statusCode);
  }

  @Post("sign-up/email")
  async signUpEmail(
    @Body() body: SignUpRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { email, password, username } = body;

      const user = await this.usersService.createUser({
        email,
        password,
        username: username || email.split("@")[0],
        role: "USER",
      });

      const response: BetterAuthResponse = {
        user: this.createUserResponse(user),
        session: null, // No session on signup
      };

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      this.handleError(error, "Signup failed", HttpStatus.BAD_REQUEST);
    }
  }

  @Post("sign-in/email")
  async signInEmail(
    @Body() body: SignInRequest,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { email, password } = body;

      const result = await this.authService.login(email, password);

      // Set secure session cookie
      res.cookie(
        SESSION_COOKIE_NAME,
        result.access_token,
        this.getCookieOptions(),
      );

      const response: BetterAuthResponse = {
        user: this.createUserResponse(result.user),
        session: this.createSessionResponse(result.access_token),
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      this.handleError(error, "Login failed", HttpStatus.UNAUTHORIZED);
    }
  }

  @Post("refresh")
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new HttpException(
          { message: "No token provided" },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Try to verify token, fallback to decode if expired
      let userData: TokenPayload;
      try {
        userData = (await this.authService.verifyToken(token)) as TokenPayload;
      } catch {
        // Token expired, try to decode without verification
        try {
          userData = this.authService.decodeToken(token) as TokenPayload;
        } catch {
          throw new HttpException(
            { message: "Invalid token" },
            HttpStatus.UNAUTHORIZED,
          );
        }
      }

      // Generate new token
      const newToken = this.authService.generateToken({
        sub: userData.sub,
        role: userData.role || "USER",
      });

      // Set new cookie
      res.cookie(SESSION_COOKIE_NAME, newToken, this.getCookieOptions());

      res.status(HttpStatus.OK).json({
        token: newToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleError(error, "Token refresh failed", HttpStatus.UNAUTHORIZED);
    }
  }

  @Get("get-session")
  async getSession(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const sessionToken = this.extractToken(req);

      if (!sessionToken) {
        res.status(HttpStatus.OK).json({
          user: null,
          session: null,
        });
        return;
      }

      try {
        const decoded = (await this.authService.verifyToken(
          sessionToken,
        )) as TokenPayload;
        const user = await this.usersService.findUserById(decoded.sub);

        if (!user) {
          res.status(HttpStatus.OK).json({
            user: null,
            session: null,
          });
          return;
        }

        const response: BetterAuthResponse = {
          user: this.createUserResponse(user),
          session: this.createSessionResponse(
            sessionToken,
            new Date(decoded.exp! * 1000),
          ),
        };

        res.status(HttpStatus.OK).json(response);
      } catch {
        // Token invalid or expired
        res.status(HttpStatus.OK).json({
          user: null,
          session: null,
        });
      }
    } catch (error) {
      this.handleError(
        error,
        "Session check failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("sign-out")
  signOut(@Res() res: Response): void {
    try {
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: this.isHttps(),
        sameSite: this.isHttps() ? ("none" as const) : ("lax" as const),
        path: "/",
      });

      res.status(HttpStatus.OK).json({
        message: "Signed out successfully",
      });
    } catch (error) {
      this.handleError(
        error,
        "Sign out failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
