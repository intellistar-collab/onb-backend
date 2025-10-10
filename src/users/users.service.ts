import { EmailService } from "./../common/services/email/email.service";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";
import { CreateUserDto } from "./dto/create-user.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreatePasswordResetDto } from "./dto/create-password-reset.dto";
import * as crypto from "crypto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Decimal } from "@prisma/client/runtime/library";

// Define interfaces for type safety
interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  address: string | null;
  mobile: string | null;
  location: string | null;
  password: string;
  otp: string | null;
  otpExpiry: Date | null;
  requiresOTP: boolean;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  dob: Date | null;
  gender: string | null;
  streetNumberOrName: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserWithWallet extends User {
  wallet?: {
    id: string;
    userId: string;
    balance: Decimal;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Input validation
    const {
      email,
      role,
      username,
      firstName,
      lastName,
      avatar,
      address,
      mobile,
      location,
      password,
    } = createUserDto;

    // Check if the email already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException("Email already exists", HttpStatus.BAD_REQUEST);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Create the user
        const user = await prisma.users.create({
          data: {
            email,
            role,
            username,
            firstName,
            lastName,
            avatar,
            address,
            mobile,
            location,
            password: hashedPassword,
          },
        });

        // Create a wallet with 0 balance for the user
        await prisma.wallet.create({
          data: { userId: user.id, balance: 0 },
        });

        return user; // Return user info (excluding wallet)
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Error creating user: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.users.delete({ where: { id } });
      return { message: "User deleted successfully" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Error deleting user: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.users.findUnique({
        where: { email },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Error fetching user: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await this.prisma.users.findUnique({
        where: { id },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Error fetching user: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const {
      email,
      role,
      username,
      password,
      firstName,
      lastName,
      avatar,
      address,
      mobile,
      location,
      otp,
      otpExpiry,
      requiresOTP,
      dob,
      gender,
      streetNumberOrName,
      street,
      city,
      state,
      zipCode,
      country,
    } = updateUserDto;
    console.log("requiresOTP", requiresOTP);
    // Check if the user exists
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    // Check if the email is already taken
    if (email) {
      const existingUser = await this.prisma.users.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new HttpException("Email already in use", HttpStatus.BAD_REQUEST);
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    try {
      return await this.prisma.users.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(role && { role }),
          ...(username && { username }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(avatar && { avatar }),
          ...(address && { address }),
          ...(mobile && { mobile }),
          ...(location && { location }),
          ...(otp !== undefined && { otp }), // Allow clearing OTP with null
          ...(otpExpiry !== undefined && { otpExpiry }), // Allow clearing expiry with null
          ...(requiresOTP !== undefined && { requiresOTP }),
          ...(dob && { dob }),
          ...(gender && { gender }),
          ...(streetNumberOrName && { streetNumberOrName }),
          ...(street && { street }),
          ...(city && { city }),
          ...(state && { state }),
          ...(zipCode && { zipCode }),
          ...(country && { country }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Error updating user: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Request password reset
  async requestPasswordReset(
    createPasswordResetDto: CreatePasswordResetDto,
  ): Promise<{ message: string }> {
    const { email } = createPasswordResetDto;

    // Find the user by email
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set the expiration for the reset token (e.g., 1 hour)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour expiration

    // Save the reset token hash and expiration to the database
    await this.prisma.users.update({
      where: { email },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: tokenExpiry,
      },
    });

    // Send the email with the reset link (including the resetToken)
    const resetLink = `${resetToken}`;
    await this.mailService.sendPasswordResetEmail(email, resetLink);

    return { message: "Password reset link has been sent to your email." };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { password, resetToken } = resetPasswordDto;

    // Find the user by reset token (using findFirst as resetToken might not be unique)
    const user = await this.prisma.users.findFirst({
      where: {
        resetToken: resetToken, // querying by resetToken explicitly
      },
    });

    if (!user) {
      throw new HttpException("Invalid reset token", HttpStatus.BAD_REQUEST);
    }

    // Check if the reset token has expired
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new HttpException(
        "Reset token has expired",
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(user);
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token and expiry
    await this.prisma.users.update({
      where: {
        id: user.id, // Use the unique ID to update
      },
      data: {
        password: hashedPassword,
        resetToken: null, // Clear the reset token
        resetTokenExpiry: null, // Clear the reset token expiry
      },
    });

    return { message: "Password has been successfully reset." };
  }

  async getAllUsers(): Promise<UserWithWallet[]> {
    return await this.prisma.users.findMany({
      include: {
        wallet: true,
      },
    });
  }
}
