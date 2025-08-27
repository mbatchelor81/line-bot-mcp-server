import { describe, it, expect } from "vitest";
import { textMessageSchema } from "../../../common/schema/textMessage.js";

describe("textMessageSchema", () => {
  describe("valid messages", () => {
    it("should validate a basic text message", () => {
      const validMessage = {
        type: "text",
        text: "Hello, World!",
      };

      const result = textMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should default type to "text" when not provided', () => {
      const messageWithoutType = {
        text: "Hello, World!",
      };

      const result = textMessageSchema.parse(messageWithoutType);
      expect(result).toEqual({
        type: "text",
        text: "Hello, World!",
      });
    });

    it("should handle empty text", () => {
      const emptyTextMessage = {
        type: "text",
        text: "",
      };

      const result = textMessageSchema.parse(emptyTextMessage);
      expect(result).toEqual(emptyTextMessage);
    });

    it("should handle text at maximum length (5000 characters)", () => {
      const maxLengthText = "a".repeat(5000);
      const maxLengthMessage = {
        type: "text",
        text: maxLengthText,
      };

      const result = textMessageSchema.parse(maxLengthMessage);
      expect(result).toEqual(maxLengthMessage);
    });

    it("should handle text with special characters", () => {
      const specialCharMessage = {
        type: "text",
        text: "Hello! 🎉 Special chars: @#$%^&*()_+-=[]{}|;:,.<>?",
      };

      const result = textMessageSchema.parse(specialCharMessage);
      expect(result).toEqual(specialCharMessage);
    });

    it("should handle multiline text", () => {
      const multilineMessage = {
        type: "text",
        text: "Line 1\nLine 2\nLine 3",
      };

      const result = textMessageSchema.parse(multilineMessage);
      expect(result).toEqual(multilineMessage);
    });
  });

  describe("invalid messages", () => {
    it("should reject text longer than 5000 characters", () => {
      const tooLongText = "a".repeat(5001);
      const invalidMessage = {
        type: "text",
        text: tooLongText,
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject non-string text", () => {
      const invalidMessage = {
        type: "text",
        text: 123,
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject null text", () => {
      const invalidMessage = {
        type: "text",
        text: null,
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject undefined text", () => {
      const invalidMessage = {
        type: "text",
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject invalid type", () => {
      const invalidMessage = {
        type: "image",
        text: "Hello, World!",
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject message without text field", () => {
      const invalidMessage = {
        type: "text",
      };

      expect(() => textMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle text with only whitespace", () => {
      const whitespaceMessage = {
        type: "text",
        text: "   \n\t   ",
      };

      const result = textMessageSchema.parse(whitespaceMessage);
      expect(result).toEqual(whitespaceMessage);
    });

    it("should handle text with unicode characters", () => {
      const unicodeMessage = {
        type: "text",
        text: "こんにちは 🌍 Здравствуй мир! 🎌",
      };

      const result = textMessageSchema.parse(unicodeMessage);
      expect(result).toEqual(unicodeMessage);
    });

    it("should handle text exactly at boundary (4999 characters)", () => {
      const boundaryText = "a".repeat(4999);
      const boundaryMessage = {
        type: "text",
        text: boundaryText,
      };

      const result = textMessageSchema.parse(boundaryMessage);
      expect(result).toEqual(boundaryMessage);
    });
  });
});
