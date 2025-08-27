import { describe, it, expect, vi, beforeEach } from "vitest";
import PushTextMessage from "../tools/pushTextMessage.js";
import { NO_USER_ID_ERROR } from "../common/schema/constants.js";

describe("PushTextMessage", () => {
  let mockClient: any;
  let mockServer: any;
  let pushTextMessage: PushTextMessage;
  const destinationId = "test-destination-id";

  beforeEach(() => {
    mockClient = {
      pushMessage: vi.fn(),
    };

    mockServer = {
      tool: vi.fn(),
    };

    pushTextMessage = new PushTextMessage(mockClient as any, destinationId);
  });

  describe("constructor", () => {
    it("should initialize with client and destination ID", () => {
      expect(pushTextMessage).toBeInstanceOf(PushTextMessage);
    });
  });

  describe("register", () => {
    it("should register the push_text_message tool with correct parameters", () => {
      pushTextMessage.register(mockServer as any);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "push_text_message",
        "Push a simple text message to a user via LINE. Use this for sending plain text messages without formatting.",
        expect.objectContaining({
          userId: expect.any(Object),
          message: expect.any(Object),
        }),
        expect.any(Function),
      );
    });

    it("should successfully push message with valid userId and message", async () => {
      const mockResponse = { messageId: "test-message-id" };
      mockClient.pushMessage.mockResolvedValue(mockResponse as any);

      pushTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: "test-user-id",
        message: { type: "text", text: "Hello, World!" },
      });

      expect(mockClient.pushMessage).toHaveBeenCalledWith({
        to: "test-user-id",
        messages: [{ type: "text", text: "Hello, World!" }],
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockResponse),
          },
        ],
      });
    });

    it("should use default destination ID when userId is not provided", async () => {
      const mockResponse = { messageId: "test-message-id" };
      mockClient.pushMessage.mockResolvedValue(mockResponse as any);

      pushTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: destinationId,
        message: { type: "text", text: "Hello, World!" },
      });

      expect(mockClient.pushMessage).toHaveBeenCalledWith({
        to: destinationId,
        messages: [{ type: "text", text: "Hello, World!" }],
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockResponse),
          },
        ],
      });
    });

    it("should return error when no userId is available", async () => {
      pushTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: "",
        message: { type: "text", text: "Hello, World!" },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: NO_USER_ID_ERROR,
          },
        ],
      });

      expect(mockClient.pushMessage).not.toHaveBeenCalled();
    });

    it("should handle LINE API client errors", async () => {
      const errorMessage = "API Error";
      mockClient.pushMessage.mockRejectedValue(new Error(errorMessage));

      pushTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: "test-user-id",
        message: { type: "text", text: "Hello, World!" },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to push message: ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle messages at the character limit", async () => {
      const longMessage = "a".repeat(5000);
      const mockResponse = { messageId: "test-message-id" };
      mockClient.pushMessage.mockResolvedValue(mockResponse as any);

      pushTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: "test-user-id",
        message: { type: "text", text: longMessage },
      });

      expect(mockClient.pushMessage).toHaveBeenCalledWith({
        to: "test-user-id",
        messages: [{ type: "text", text: longMessage }],
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockResponse),
          },
        ],
      });
    });

    it("should handle empty destination ID in constructor", async () => {
      const pushTextMessageEmpty = new PushTextMessage(mockClient as any, "");
      pushTextMessageEmpty.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        userId: "",
        message: { type: "text", text: "Hello, World!" },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: NO_USER_ID_ERROR,
          },
        ],
      });
    });
  });
});
