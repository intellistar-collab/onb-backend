import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { OtpDto } from "./dto/otp.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Login user and return JWT token" })
  @ApiResponse({ status: 200, description: "Successfully logged in" })
  async login(@Body() loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post("request-otp")
  @ApiOperation({ summary: "Request OTP for login" })
  @ApiResponse({ status: 200, description: "OTP sent to email" })
  async requestOTP(@Body() loginDto: LoginDto): Promise<{ message: string }> {
    return this.authService.requestOTP(loginDto.email, loginDto.password);
  }

  @Post("verify-otp")
  @ApiOperation({ summary: "Verify OTP and get JWT token" })
  @ApiResponse({ status: 200, description: "Successfully logged in" })
  async verifyOTP(@Body() otpDto: OtpDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.verifyOTP(otpDto.email, otpDto.otp);
  }

  @Post("sign-up/email")
  @ApiOperation({ summary: "Sign up with email and password" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  async signUp(@Body() createUserDto: CreateUserDto): Promise<{
    user: any;
    message: string;
  }> {
    return await this.authService.signUp(createUserDto);
  }
}
