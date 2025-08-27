import { describe, it, expect } from "vitest";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../../common/response.js";

describe("Response utilities", () => {
  describe("createErrorResponse", () => {
    it("should create error response with correct structure", () => {
      const errorMessage = "Test error message";
      const result = createErrorResponse(errorMessage);

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
      });
    });

    it("should handle empty error message", () => {
      const result = createErrorResponse("");

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      });
    });

    it("should handle long error messages", () => {
      const longMessage = "Error: ".repeat(1000);
      const result = createErrorResponse(longMessage);

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: "text",
            text: longMessage,
          },
        ],
      });
    });
  });

  describe("createSuccessResponse", () => {
    it("should create success response with JSON stringified object", () => {
      const responseObject = { messageId: "test-123", status: "sent" };
      const result = createSuccessResponse(responseObject);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(responseObject),
          },
        ],
      });
    });

    it("should handle empty object", () => {
      const result = createSuccessResponse({});

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "{}",
          },
        ],
      });
    });

    it("should handle complex nested objects", () => {
      const complexObject = {
        messageId: "test-123",
        metadata: {
          timestamp: "2025-01-01T00:00:00Z",
          recipients: ["user1", "user2"],
          settings: {
            priority: "high",
            retries: 3,
          },
        },
      };
      const result = createSuccessResponse(complexObject);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(complexObject),
          },
        ],
      });
    });

    it("should handle arrays", () => {
      const arrayObject = [
        { id: 1, name: "test" },
        { id: 2, name: "test2" },
      ];
      const result = createSuccessResponse(arrayObject);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(arrayObject),
          },
        ],
      });
    });
  });
});
