import { describe, it, expect, vi, beforeEach } from "vitest";
import BroadcastTextMessage from "../tools/broadcastTextMessage.js";

describe("BroadcastTextMessage", () => {
  let mockClient: any;
  let mockServer: any;
  let broadcastTextMessage: BroadcastTextMessage;

  beforeEach(() => {
    mockClient = {
      broadcast: vi.fn(),
    };

    mockServer = {
      tool: vi.fn(),
    };

    broadcastTextMessage = new BroadcastTextMessage(mockClient as any);
  });

  describe("constructor", () => {
    it("should initialize with client", () => {
      expect(broadcastTextMessage).toBeInstanceOf(BroadcastTextMessage);
    });
  });

  describe("register", () => {
    it("should register the broadcast_text_message tool with correct parameters", () => {
      broadcastTextMessage.register(mockServer as any);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "broadcast_text_message",
        "Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending plain text messages without formatting. Please be aware that this message will be sent to all users.",
        expect.objectContaining({
          message: expect.any(Object),
        }),
        expect.any(Function),
      );
    });

    it("should successfully broadcast message", async () => {
      const mockResponse = { messageId: "test-broadcast-id" };
      mockClient.broadcast.mockResolvedValue(mockResponse as any);

      broadcastTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        message: { type: "text", text: "Hello, everyone!" },
      });

      expect(mockClient.broadcast).toHaveBeenCalledWith({
        messages: [{ type: "text", text: "Hello, everyone!" }],
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

    it("should handle LINE API client errors", async () => {
      const errorMessage = "Broadcast API Error";
      mockClient.broadcast.mockRejectedValue(new Error(errorMessage));

      broadcastTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        message: { type: "text", text: "Hello, everyone!" },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to broadcast message: ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle messages at the character limit", async () => {
      const longMessage = "a".repeat(5000);
      const mockResponse = { messageId: "test-broadcast-id" };
      mockClient.broadcast.mockResolvedValue(mockResponse as any);

      broadcastTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        message: { type: "text", text: longMessage },
      });

      expect(mockClient.broadcast).toHaveBeenCalledWith({
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

    it("should handle empty message text", async () => {
      const mockResponse = { messageId: "test-broadcast-id" };
      mockClient.broadcast.mockResolvedValue(mockResponse as any);

      broadcastTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        message: { type: "text", text: "" },
      });

      expect(mockClient.broadcast).toHaveBeenCalledWith({
        messages: [{ type: "text", text: "" }],
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

    it("should handle network timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockClient.broadcast.mockRejectedValue(timeoutError);

      broadcastTextMessage.register(mockServer as any);
      const toolHandler = mockServer.tool.mock.calls[0][3];

      const result = await toolHandler({
        message: { type: "text", text: "Hello, everyone!" },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: "Failed to broadcast message: Request timeout",
          },
        ],
      });
    });
  });
});
