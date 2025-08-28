# LINE Bot MCP Server

[![npmjs](https://badge.fury.io/js/%40line%2Fline-bot-mcp-server.svg)](https://www.npmjs.com/package/@line/line-bot-mcp-server)

LINE公式アカウントとAI Agentを接続するために、LINE Messaging APIを統合する[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) Server

![](/assets/demo.ja.png)

> [!NOTE]
> このリポジトリはプレビュー版として提供されています。実験的な目的で提供されており、完全な機能や包括的なサポートが含まれていないことにご注意ください。

## Tools

{{TOOLS_SECTION}}

## インストール (npxを使用)

要件:
- Node.js v20 以上

### Step 1: LINE公式アカウントを作成

このMCP ServerはLINE公式アカウントを利用しています。公式アカウントをお持ちでない場合は、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#create-oa)に従って作成してください。

LINE公式アカウントをお持ちであれば、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#using-oa-manager)に従ってMessaging APIを有効にしてください。

### Step 2: AI Agentを設定

Claude DesktopやClaudeなどのAI Agentに次の設定を追加してください。

環境変数や引数は次のように設定してください:

- `CHANNEL_ACCESS_TOKEN`: (必須) チャネルアクセストークン。これを取得するには、[こちらの手順](https://developers.line.biz/ja/docs/basics/channel-access-token/#long-lived-channel-access-token)に従ってください。
- `DESTINATION_USER_ID`: (オプション) デフォルトのメッセージ受信者のユーザーID。Toolの入力に`user_id`が含まれていない場合、`DESTINATION_USER_ID`は必ず設定する必要があります。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-user-ids/#get-own-user-id)に従ってください。

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "npx",
      "args": [
        "@line/line-bot-mcp-server"
      ],
      "env": {
        "CHANNEL_ACCESS_TOKEN" : "FILL_HERE",
        "DESTINATION_USER_ID" : "FILL_HERE"
      }
    }
  }
}
```

## インストール (Dockerを使用)

### Step 1: LINE公式アカウントを作成

このMCP ServerはLINE公式アカウントを利用しています。公式アカウントをお持ちでない場合は、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#create-oa)に従って作成してください。

LINE公式アカウントをお持ちであれば、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-started/#using-oa-manager)に従ってMessaging APIを有効にしてください。

### Step 2: line-bot-mcp-serverをインストール

このリポジトリをクローンします:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Dockerイメージをビルドします:
```
docker build -t line/line-bot-mcp-server .
```

### Step 3: AI Agentを設定

Claude DesktopやClaudeなどのAI Agentに次の設定を追加してください。

環境変数や引数は次のように設定してください:

- `mcpServers.args`: (必須) `line-bot-mcp-server`へのパス。
- `CHANNEL_ACCESS_TOKEN`: (必須) チャネルアクセストークン。これを取得するには、[こちらの手順](https://developers.line.biz/ja/docs/basics/channel-access-token/#long-lived-channel-access-token)に従ってください。
- `DESTINATION_USER_ID`: (オプション) デフォルトのメッセージ受信者のユーザーID。Toolの入力に`user_id`が含まれていない場合、`DESTINATION_USER_ID`は必ず設定する必要があります。これを確認するには、[こちらの手順](https://developers.line.biz/ja/docs/messaging-api/getting-user-ids/#get-own-user-id)に従ってください。

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "CHANNEL_ACCESS_TOKEN",
        "-e",
        "DESTINATION_USER_ID",
        "line/line-bot-mcp-server"
      ],
      "env": {
        "CHANNEL_ACCESS_TOKEN" : "FILL_HERE",
        "DESTINATION_USER_ID" : "FILL_HERE"
      }
    }
  }
}
```

## Inspector を使用したローカル開発

MCP Inspector を使用して、サーバーをローカルでテストおよびデバッグできます。

### 前提条件

1. リポジトリをクローンする：
```bash
git clone git@github.com:line/line-bot-mcp-server.git
cd line-bot-mcp-server
```

2. 依存関係をインストールする：
```bash
npm install
```

3. プロジェクトをビルドする：
```bash
npm run build
```

### Inspector の実行

プロジェクトをビルドした後、MCP Inspector を起動できます：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

これにより、MCP Inspector インターフェースが起動し、LINE Bot MCP Server のツールを操作して機能をテストできます。
