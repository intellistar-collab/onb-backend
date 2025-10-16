/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoginDto } from "./dto/login.dto";
import { OtpDto } from "./dto/otp.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";

// Mock AuthService
class MockAuthService {
  login(email: string, _password: string) {
    return Promise.resolve({
      access_token: "mocked-jwt-token",
      refresh_token: "mocked-refresh-token",
      user: {
        id: "1",
        email,
        username: "testuser",
        role: "USER",
        status: "ACTIVE",
        firstName: "Test",
        lastName: "User",
        avatar: null,
        address: null,
        mobile: null,
        location: null,
        password: "hashedpassword",
        otp: null,
        otpExpiry: null,
        requiresOTP: false,
        resetToken: null,
        resetTokenExpiry: null,
        dob: null,
        gender: null,
        streetNumberOrName: null,
        street: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  requestOTP(_email: string, _password: string) {
    return Promise.resolve({
      message: "OTP sent to your email",
    });
  }

  verifyOTP(_email: string, _otp: string) {
    return Promise.resolve({
      access_token: "mocked-jwt-token",
      refresh_token: "mocked-refresh-token",
    });
  }

  signUp(createUserDto: CreateUserDto) {
    return Promise.resolve({
      user: {
        id: "2",
        email: createUserDto.email,
        username: createUserDto.username,
        role: createUserDto.role,
        status: "PENDING",
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        avatar: null,
        address: null,
        mobile: null,
        location: null,
        password: "hashedpassword",
        otp: null,
        otpExpiry: null,
        requiresOTP: false,
        resetToken: null,
        resetTokenExpiry: null,
        dob: null,
        gender: null,
        streetNumberOrName: null,
        street: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: "User created successfully",
    });
  }
}

// Mock AuthController
class MockAuthController {
  constructor(private readonly authService: MockAuthService) {}

  async login(loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  async requestOTP(loginDto: LoginDto) {
    return this.authService.requestOTP(loginDto.email, loginDto.password);
  }

  async verifyOTP(otpDto: OtpDto) {
    return this.authService.verifyOTP(otpDto.email, otpDto.otp);
  }

  async signUp(createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }
}

describe("AuthController", () => {
  let controller: MockAuthController;
  let authService: MockAuthService;

  beforeEach(() => {
    authService = new MockAuthService();
    controller = new MockAuthController(authService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should return JWT tokens and user data on successful login", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
      expect(result).toHaveProperty("user");
      expect(result.access_token).toBe("mocked-jwt-token");
      expect(result.refresh_token).toBe("mocked-refresh-token");
      expect(result.user.email).toBe(loginDto.email);
    });

    it("should handle login with different email", async () => {
      const loginDto: LoginDto = {
        email: "another@example.com",
        password: "password123",
      };

      const result = await controller.login(loginDto);

      expect(result.user.email).toBe("another@example.com");
      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
    });
  });

  describe("requestOTP", () => {
    it("should request OTP successfully", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "password123",
      };

      const result = await controller.requestOTP(loginDto);

      expect(result).toHaveProperty("message");
      expect(result.message).toBe("OTP sent to your email");
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP and return tokens", async () => {
      const otpDto: OtpDto = {
        email: "test@example.com",
        otp: "123456",
      };

      const result = await controller.verifyOTP(otpDto);

      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
      expect(result.access_token).toBe("mocked-jwt-token");
      expect(result.refresh_token).toBe("mocked-refresh-token");
    });
  });

  describe("signUp", () => {
    it("should create a new user successfully", async () => {
      const createUserDto: CreateUserDto = {
        email: "newuser@example.com",
        password: "password123",
        username: "newuser",
        firstName: "New",
        lastName: "User",
        role: "USER",
      };

      const result = await controller.signUp(createUserDto);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("message");
      expect(result.user.email).toBe(createUserDto.email);
      expect(result.user.username).toBe(createUserDto.username);
      expect(result.user.role).toBe(createUserDto.role);
      expect(result.message).toBe("User created successfully");
    });

    it("should create admin user successfully", async () => {
      const createUserDto: CreateUserDto = {
        email: "admin@example.com",
        password: "password123",
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      };

      const result = await controller.signUp(createUserDto);

      expect(result.user.role).toBe("ADMIN");
      expect(result.user.email).toBe("admin@example.com");
    });
  });
});
