import { Controller, Post, Get, Body, Res, Req } from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

// Define interfaces for better type safety
interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
}

interface SignInRequest {
  email: string;
  password: string;
}

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
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

interface BetterAuthErrorResponse {
  message: string;
}

@Controller("api/auth")
export class BetterAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post("sign-up/email")
  async signUpEmail(
    @Body() body: SignUpRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { email, password, name, username } = body;

      // Create user using existing service
      const user = await this.usersService.createUser({
        email,
        password,
        username: name || username || email.split("@")[0],
        role: "USER", // Default role for new users
      });

      // Return better-auth compatible response
      const response: BetterAuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        session: null, // No session created on signup
      };

      res.status(201).json(response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Signup failed";
      const errorResponse: BetterAuthErrorResponse = {
        message: errorMessage,
      };
      res.status(400).json(errorResponse);
    }
  }

  @Post("sign-in/email")
  async signInEmail(
    @Body() body: SignInRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { email, password } = body;

      // Login using existing service
      const result = await this.authService.login(email, password);

      // Set session cookie
      const cookieOptions = {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production" && !!process.env.FRONTEND_URL,
        sameSite: "lax" as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      };

      res.cookie(
        "better-auth.session_token",
        result.access_token,
        cookieOptions,
      );

      // Return better-auth compatible response
      const response: BetterAuthResponse = {
        user: {
          id: result.user?.id || "",
          email: result.user?.email || "",
          name: result.user?.username || "",
          username: result.user?.username || "",
          role: result.user?.role || "USER",
          avatar: result.user?.avatar || null,
          createdAt: result.user?.createdAt || new Date(),
          updatedAt: result.user?.updatedAt || new Date(),
        },
        session: {
          token: result.access_token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      const errorResponse: BetterAuthErrorResponse = {
        message: errorMessage,
      };
      res.status(401).json(errorResponse);
    }
  }

  @Get("get-session")
  async getSession(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // Check for session token in cookies or headers
      const cookies = (req.cookies as Record<string, string>) || {};
      const sessionToken =
        cookies["better-auth.session_token"] ||
        cookies["session"] ||
        req.headers.authorization?.replace("Bearer ", "");

      if (!sessionToken) {
        res.status(200).json({
          user: null,
          session: null,
        });
        return;
      }

      // Verify the token and get user data
      try {
        const decoded = (await this.authService.verifyToken(sessionToken)) as {
          sub: string;
          exp: number;
        };
        const userId = decoded.sub;
        const user = await this.usersService.findUserById(userId);

        if (!user) {
          res.status(200).json({
            user: null,
            session: null,
          });
          return;
        }

        // Return better-auth compatible response
        const response: BetterAuthResponse = {
          user: {
            id: user.id,
            email: user.email,
            name: user.username,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          session: {
            token: sessionToken,
            expiresAt: new Date(decoded.exp * 1000),
          },
        };

        res.status(200).json(response);
      } catch {
        // Token is invalid or expired
        res.status(200).json({
          user: null,
          session: null,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Session check failed";
      const errorResponse: BetterAuthErrorResponse = {
        message: errorMessage,
      };
      res.status(500).json(errorResponse);
    }
  }

  @Post("sign-out")
  signOut(@Res() res: Response): void {
    try {
      // Clear the session cookie
      res.clearCookie("better-auth.session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(200).json({
        message: "Signed out successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      const errorResponse: BetterAuthErrorResponse = {
        message: errorMessage,
      };
      res.status(500).json(errorResponse);
    }
  }
}
