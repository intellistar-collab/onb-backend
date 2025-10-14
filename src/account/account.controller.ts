import {
  Controller,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
} from "@nestjs/common";
import { AccountService } from "./account.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { BetterAuthGuard } from "../auth/better-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags("Account")
@ApiBearerAuth()
@Controller("api/account")
@UseGuards(BetterAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getProfile(@Request() req: AuthenticatedRequest) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.accountService.getProfile(userId);
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to fetch profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put("profile")
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: "Update current user profile" })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.accountService.updateProfile(userId, updateProfileDto);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to update profile",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put("change-password")
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: "Change user password" })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.accountService.changePassword(
        userId,
        changePasswordDto,
      );
    } catch (error: unknown) {
      console.error("Error changing password:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to change password",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("wallet-score")
  @ApiOperation({ summary: "Get user wallet balance and score" })
  @ApiResponse({
    status: 200,
    description: "Wallet and score retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getWalletAndScore(@Request() req: AuthenticatedRequest) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED,
        );
      }
      return await this.accountService.getWalletAndScore(userId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpException(
        `Failed to get wallet and score: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
