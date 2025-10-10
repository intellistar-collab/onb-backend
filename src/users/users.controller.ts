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
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../auth/role.enum";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RolesGuard } from "../auth/roles.guard";
import { CreatePasswordResetDto } from "./dto/create-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

// Define interfaces for type safety
interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  address?: string;
  mobile?: string;
  location?: string;
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
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    try {
      // Create the user by passing the CreateUserDto object directly
      return (await this.usersService.createUser(createUserDto)) as User;
    } catch (error: unknown) {
      console.log(error);
      // Handle service layer errors
      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }
      // Generic internal server error
      throw new HttpException(
        "Internal Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
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
      return (await this.usersService.deleteUser(id)) as { message: string };
    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }
      throw new HttpException(
        "Internal Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "All users retrieved successfully" })
  @ApiResponse({ status: 500, description: "Internal Server Error" })
  async getAllUsers(): Promise<User[]> {
    try {
      return (await this.usersService.getAllUsers()) as User[];
    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }

      throw new HttpException(
        "Internal Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update user email or role" })
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
      return (await this.usersService.updateUser(id, updateUserDto)) as User;
    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      if (errorResponse.response && errorResponse.status) {
        throw new HttpException(errorResponse.response, errorResponse.status);
      }
      throw new HttpException(
        "Internal Server Error",
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
