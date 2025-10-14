import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          username: true,
          email: true,
          avatar: true,
          address: true,
          streetNumberOrName: true,
          street: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          mobile: true,
          location: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      // Validate and process date format if provided
      if (updateProfileDto.dob && updateProfileDto.dob.trim() !== "") {
        const date = new Date(updateProfileDto.dob);
        if (isNaN(date.getTime())) {
          throw new HttpException(
            "Invalid date format. Please provide a valid date.",
            HttpStatus.BAD_REQUEST,
          );
        }
        // Convert to ISO string for consistent storage
        updateProfileDto.dob = date.toISOString();
      } else {
        // Set empty or invalid dates to null for Prisma
        updateProfileDto.dob = null;
      }

      // Check if user exists
      const existingUser = await this.prisma.users.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      // Check if email is being changed and if it's already taken
      if (
        updateProfileDto.email &&
        updateProfileDto.email !== existingUser.email
      ) {
        const emailExists = await this.prisma.users.findUnique({
          where: { email: updateProfileDto.email },
        });

        if (emailExists) {
          throw new HttpException("Email already exists", HttpStatus.CONFLICT);
        }
      }

      // Check if username is being changed and if it's already taken
      if (
        updateProfileDto.username &&
        updateProfileDto.username !== existingUser.username
      ) {
        const usernameExists = await this.prisma.users.findFirst({
          where: { username: updateProfileDto.username },
        });

        if (usernameExists) {
          throw new HttpException(
            "Username already exists",
            HttpStatus.CONFLICT,
          );
        }
      }

      // Update user profile
      const updatedUser = await this.prisma.users.update({
        where: { id: userId },
        data: {
          ...updateProfileDto,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          username: true,
          email: true,
          avatar: true,
          address: true,
          streetNumberOrName: true,
          street: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          mobile: true,
          location: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      throw error;
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const { currentPassword, newPassword } = changePasswordDto;

      // Get user with password
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new HttpException(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      return { message: "Password changed successfully" };
    } catch (error) {
      console.error("Error in changePassword:", error);
      throw error;
    }
  }

  async getWalletAndScore(userId: string) {
    try {
      // Get wallet
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Get latest score
      const score = await this.prisma.score.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!score) {
        throw new Error("Score not found");
      }

      return {
        wallet: {
          id: wallet.id,
          balance: Number(wallet.balance),
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        },
        score: {
          id: score.id,
          score: score.score,
          source: score.source,
          createdAt: score.createdAt,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get wallet and score: ${errorMessage}`);
    }
  }
}
