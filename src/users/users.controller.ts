import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Put,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../auth/role.enum";
import { UpdateUserDto } from "./dto/update-user.dto";
import { BetterAuthGuard } from "../auth/better-auth.guard";
import { BetterAuthRolesGuard } from "../auth/better-auth-roles.guard";
import { CreatePasswordResetDto } from "./dto/create-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

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
  createdAt: Date;
  updatedAt: Date;
}

interface ErrorResponse {
  response?: string | Record<string, any>;
  status?: number;
}

@ApiTags("Users")
@ApiBearerAuth() // Requires JWT authentication
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.usersService.createUser(createUserDto);
    } catch (error: unknown) {
      console.error("Error creating user:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle service layer errors
      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }

      // Generic internal server error
      throw new HttpException(
        "Failed to create user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(":id")
  @UseGuards(BetterAuthGuard, BetterAuthRolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Delete a user by ID" })
  @ApiParam({
    name: "id",
    description: "The ID of the user to delete",
    type: String,
  })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async deleteUser(@Param("id") id: string): Promise<{ message: string }> {
    try {
      return await this.usersService.deleteUser(id);
    } catch (error: unknown) {
      console.error("Error deleting user:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }

      throw new HttpException(
        "Failed to delete user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(BetterAuthGuard, BetterAuthRolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "All users retrieved successfully" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getAllUsers(): Promise<User[]> {
    try {
      return await this.usersService.getAllUsers();
    } catch (error: unknown) {
      console.error("Error fetching users:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }

      throw new HttpException(
        "Failed to fetch users",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  @UseGuards(BetterAuthGuard, BetterAuthRolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: "Update user information" })
  @ApiParam({ name: "id", description: "User ID", type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      return await this.usersService.updateUser(id, updateUserDto);
    } catch (error: unknown) {
      console.error("Error updating user:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }

      throw new HttpException(
        "Failed to update user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("request-password-reset")
  @ApiOperation({ summary: "Request password reset email" })
  @ApiResponse({ status: 200, description: "Password reset link sent" })
  async requestPasswordReset(
    @Body() createPasswordResetDto: CreatePasswordResetDto,
  ): Promise<{ message: string }> {
    return (await this.usersService.requestPasswordReset(
      createPasswordResetDto,
    )) as { message: string };
  }

  @Post("reset-password")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: "Reset password using the reset token" })
  @ApiResponse({
    status: 200,
    description: "Password has been successfully reset",
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return (await this.usersService.resetPassword(resetPasswordDto)) as {
      message: string;
    };
  }
}
