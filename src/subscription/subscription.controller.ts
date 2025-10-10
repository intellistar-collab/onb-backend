import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { SubscriptionService } from "./subscription.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { EmailService } from "src/common/services/email/email.service";
import { SendBulkEmailDto } from "./dto/send-bulk-email.dto";
import { SendToSpecificDto } from "./dto/SendToSpecificDto";
import { VerifySubscriptionDto } from "./dto/verify-subscription.dto";

// Define interfaces for type safety
interface Subscription {
  id: string;
  email: string;
  username: string;
  verified: boolean;
  verifiedAt?: Date | null;
  followUpEmailSent: boolean;
  referrerEmail?: string | null;
}

interface SubscriptionResponse {
  data: Subscription;
  message: string;
}

interface PaginatedResponse {
  data: Subscription[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@ApiTags("Subscriptions")
@Controller("subscriptions")
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Add a new email to the subscription list" })
  @ApiResponse({ status: 201, description: "Email successfully subscribed" })
  @ApiResponse({ status: 409, description: "Email already subscribed" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async subscribe(
    @Body(ValidationPipe) body: CreateSubscriptionDto,
  ): Promise<Subscription> {
    try {
      const subscription = await this.subscriptionService.create(body);
      console.log("subscription data", subscription);
      await this.emailService.sendEmailWhenSubscribe(subscription);
      return subscription as Subscription;
    } catch (error: unknown) {
      console.log(error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: "Get all subscribed emails (paginated)" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiResponse({ status: 200, description: "List of subscribed emails" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async getAllSubscriptions(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ): Promise<PaginatedResponse> {
    return this.subscriptionService.findAll(
      Number(page),
      Number(limit),
    ) as unknown as Promise<PaginatedResponse>;
  }

  @Get("all")
  @ApiOperation({ summary: "Get all subscribed emails (no pagination)" })
  @ApiResponse({
    status: 200,
    description: "Complete list of subscribed emails",
  })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async getAllSubscriptionsUnpaginated(): Promise<Subscription[]> {
    return this.subscriptionService.findAllUnpaginated() as unknown as Promise<
      Subscription[]
    >;
  }

  @Post("send-email-to-all")
  @ApiOperation({ summary: "Send bulk email to all subscribers" })
  @ApiResponse({ status: 200, description: "Emails sent successfully" })
  @ApiResponse({ status: 500, description: "Failed to send emails" })
  @ApiBody({
    type: SendBulkEmailDto,
    examples: {
      default: {
        summary: "Sample payload",
        value: {
          subject: "🔥 Special Offer!",
          message: `
            <div style="font-family:Arial,sans-serif;">
              <h4 style="color:#b2249f;">Welcome to One Night Box</h4>
              <p>Thanks for joining our community. Stay tuned for special offers.</p>
            </div>
          `,
        },
      },
    },
  })
  async sendEmailToSubscribers(
    @Body(new ValidationPipe()) body: SendBulkEmailDto,
  ) {
    return this.emailService.sendBulkEmail(body.subject, body.message);
  }

  @Post("send-email-to-specific")
  @ApiOperation({ summary: "Send email to selected subscribers only" })
  @ApiResponse({
    status: 200,
    description: "Emails sent successfully to selected recipients",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email list or missing fields",
  })
  @ApiResponse({ status: 500, description: "Failed to send emails" })
  @ApiBody({
    type: SendToSpecificDto,
    examples: {
      default: {
        summary: "Sample payload",
        value: {
          emails: ["user1@example.com", "user2@example.com"],
          subject: "💌 Personalized Update",
          message: `
          <div style="font-family:Arial,sans-serif;">
            <h4>Hello!</h4>
            <p>We're reaching out just to you with a special message.</p>
          </div>
        `,
        },
      },
    },
  })
  async sendEmailToSpecific(
    @Body(new ValidationPipe()) body: SendToSpecificDto,
  ) {
    return this.emailService.sendEmailsToSelected(
      body.emails,
      body.subject,
      body.message,
    );
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify subscription using token" })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 409, description: "Invalid or expired token" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async verify(
    @Body(new ValidationPipe()) body: VerifySubscriptionDto,
  ): Promise<string> {
    const subscription = (await this.subscriptionService.verifySubscription(
      body.token,
    )) as SubscriptionResponse;
    console.log("subscription", subscription);

    await this.emailService.sendWelcomeEmail(subscription.data);
    if (
      subscription.data?.referrerEmail &&
      !subscription.data?.followUpEmailSent
    ) {
      const subscriptionData = await this.subscriptionService.findOne(
        subscription.data.referrerEmail,
      );
      console.log("subscriptionData", subscriptionData?.existing);
      await this.emailService.sendEmailSuccessfulReferral(
        subscriptionData?.existing,
      );
    }

    return subscription.message;
  }
}
