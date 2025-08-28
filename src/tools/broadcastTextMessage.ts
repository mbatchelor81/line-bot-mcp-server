import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";
import { textMessageSchema } from "../common/schema/textMessage.js";

export default class BroadcastTextMessage extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    // Tool descriptions for README generation
    // en: Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending plain text messages without formatting. Please be aware that this message will be sent to all users.
    // ja: LINE公式アカウントと友だちになっているすべてのユーザーに、LINEでシンプルなテキストメッセージを送信する。
    server.tool(
      "broadcast_text_message",
      "Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending " +
        "plain text messages without formatting. Please be aware that this message will be sent to all users.",
      {
        message: textMessageSchema,
      },
      async ({ message }) => {
        try {
          const response = await this.client.broadcast({
            messages: [message as unknown as messagingApi.Message],
          });
          return createSuccessResponse(response);
        } catch (error) {
          return createErrorResponse(
            `Failed to broadcast message: ${error.message}`,
          );
        }
      },
    );
  }
}
