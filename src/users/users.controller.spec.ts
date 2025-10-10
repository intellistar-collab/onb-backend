import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

// Define interfaces for type safety
interface MockUser {
  id: string;
  email: string;
  password?: string;
  role: string;
  username?: string;
}

interface MockService {
  createUser: jest.Mock;
  deleteUser: jest.Mock;
  getAllUsers: jest.Mock;
  updateUser: jest.Mock;
}

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService: MockService = {
    createUser: jest.fn().mockImplementation(
      (dto: CreateUserDto): MockUser => ({
        id: "1",
        email: dto.email,
        username: dto.username,
        role: dto.role,
      }),
    ),
    deleteUser: jest.fn().mockResolvedValue({ message: "User deleted" }),
    getAllUsers: jest
      .fn()
      .mockResolvedValue([
        { id: "1", email: "test@example.com", role: "USER" } as MockUser,
      ]),
    updateUser: jest.fn().mockImplementation(
      (id: string, dto: UpdateUserDto): MockUser => ({
        id,
        email: dto.email || "test@example.com",
        role: dto.role || "USER",
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createUser", () => {
    it("should create a user", async () => {
      const dto: CreateUserDto = {
        username: "testuser",
        email: "test@example.com",
        password: "12345",
        role: "ADMIN",
      };
      const result = (await controller.createUser(dto)) as MockUser;
      expect(result).toEqual({
        id: "1",
        email: "test@example.com",
        password: "12345",
        role: "ADMIN",
      });
      const createUserSpy = jest.spyOn(usersService, "createUser");
      expect(createUserSpy).toHaveBeenCalledWith(dto);
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const result = (await controller.deleteUser("1")) as { message: string };
      expect(result).toEqual({ message: "User deleted" });
      const deleteUserSpy = jest.spyOn(usersService, "deleteUser");
      expect(deleteUserSpy).toHaveBeenCalledWith("1");
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const result = (await controller.getAllUsers()) as MockUser[];
      expect(result).toEqual([
        { id: "1", email: "test@example.com", role: "USER" },
      ]);
      const getAllUsersSpy = jest.spyOn(usersService, "getAllUsers");
      expect(getAllUsersSpy).toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      const dto: UpdateUserDto = {
        email: "new@example.com",
        role: "ADMIN",
      } as UpdateUserDto;
      const result = (await controller.updateUser("1", dto)) as MockUser;
      expect(result).toEqual({
        id: "1",
        email: "new@example.com",
        role: "ADMIN",
      });
      const updateUserSpy = jest.spyOn(usersService, "updateUser");
      expect(updateUserSpy).toHaveBeenCalledWith("1", dto);
    });
  });
});
