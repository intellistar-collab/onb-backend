import { Controller, Post, Body, Res } from "@nestjs/common";
import { Response } from "express";
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
  error: {
    message: string;
  };
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
        error: {
          message: errorMessage,
        },
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
        error: {
          message: errorMessage,
        },
      };
      res.status(401).json(errorResponse);
    }
  }
}
