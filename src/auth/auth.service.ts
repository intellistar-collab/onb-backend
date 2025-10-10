import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcryptjs";

import { randomBytes, randomInt } from "crypto";
import { EmailService } from "src/common/services/email/email.service";

// Define user interface to avoid 'any' type warnings
interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  requiresOTP: boolean;
  otp?: string | null;
  otpExpiry?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiry?: Date | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = (await this.usersService.findUserByEmail(
      email,
    )) as User | null;
    if (!user) throw new UnauthorizedException("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException("Invalid credentials");

    // Check if user requires OTP for first login
    if (user.requiresOTP === true) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        requiresOTP: true,
      };
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      requiresOTP: false,
    };
  }

  // Step 2: Generate OTP
  generateOTP(): string {
    return randomInt(100000, 999999).toString(); // Generates a 6-digit OTP
  }

  // Step 4: Request OTP during Login
  async requestOTP(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user.requiresOTP) {
      // If OTP is not required, log in directly
      return this.login(email, password);
    }
    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // OTP expires in 5 minutes
    // Save OTP & Expiry in DB (assuming Prisma)
    await this.usersService.updateUser(user.id, { otp, otpExpiry });

    // Send OTP to user's email
    await this.emailService.sendOTP(email, otp);

    return { message: "OTP sent to email" };
  }

  // Step 5: Verify OTP & Issue JWT Token
  async verifyOTP(email: string, otp: string) {
    const user = (await this.usersService.findUserByEmail(
      email,
    )) as User | null;
    if (!user) throw new UnauthorizedException("User not found");

    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException("Invalid OTP");
    }

    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      throw new BadRequestException("OTP expired");
    }

    // Clear OTP after successful login
    await this.usersService.updateUser(user.id, {
      otp: null,
      otpExpiry: null,
      requiresOTP: false,
    });
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await this.usersService.updateUser(user.id, {
      refreshToken,
      refreshTokenExpiry,
    });

    return {
      access_token: this.jwtService.sign({ sub: user.id, role: user.role }),
      refresh_token: refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days expiry

    await this.usersService.updateUser(user.id, {
      refreshToken,
      refreshTokenExpiry,
    });

    return {
      access_token: this.jwtService.sign({ sub: user.id, role: user.role }),
      refresh_token: refreshToken,
    };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verify(token); // Verify and decode the token
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Invalid token: ${errorMessage}`);
    }
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString("hex");
  }

  async refresh(email: string, refreshToken: string) {
    const user = (await this.usersService.findUserByEmail(
      email,
    )) as User | null;
    if (!user) throw new UnauthorizedException("User not found");

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      throw new BadRequestException("Invalid refresh token");
    }

    if (
      user.refreshTokenExpiry &&
      new Date() > new Date(user.refreshTokenExpiry)
    ) {
      throw new BadRequestException("Refresh token expired");
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, role: user.role }),
    };
  }
}
