import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { messagingApi } from "@line/bot-sdk";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../common/response.js";
import { AbstractTool } from "./AbstractTool.js";

export default class GetRichMenuList extends AbstractTool {
  private client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    super();
    this.client = client;
  }

  register(server: McpServer) {
    // Tool descriptions for README generation
    // en: Get the list of rich menus associated with your LINE Official Account.
    // ja: LINE公式アカウントに登録されているリッチメニューの一覧を取得する。
    server.tool(
      "get_rich_menu_list",
      "Get the list of rich menus associated with your LINE Official Account.",
      {},
      async () => {
        try {
          const response = await this.client.getRichMenuList();
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
