[日本語版 READMEはこちら](README.ja.md)

# LINE Bot MCP Server

[![npmjs](https://badge.fury.io/js/%40line%2Fline-bot-mcp-server.svg)](https://www.npmjs.com/package/@line/line-bot-mcp-server)

[Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) server implementation that integrates the LINE Messaging API to connect an AI Agent to the LINE Official Account.

![](/assets/demo.png)

> [!NOTE]
> This repository is provided as a preview version. While we offer it for experimental purposes, please be aware that it may not include complete functionality or comprehensive support.

## Tools

{{TOOLS_SECTION}}

## Installation (Using npx)

requirements:
- Node.js v20 or later

### Step 1: Create LINE Official Account

This MCP server utilizes a LINE Official Account. If you do not have one, please create it by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#create-oa). 

If you have a LINE Official Account, enable the Messaging API for your LINE Official Account by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#using-oa-manager).

### Step 2: Configure AI Agent

Please add the following configuration for an AI Agent like Claude Desktop or Cline. 

Set the environment variables or arguments as follows:

- `CHANNEL_ACCESS_TOKEN`: (required) Channel Access Token. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/basics/channel-access-token/#long-lived-channel-access-token).
- `DESTINATION_USER_ID`: (optional) The default user ID of the recipient. If the Tool's input does not include `user_id`, `DESTINATION_USER_ID` is required. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id).

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

## Installation (Using Docker)

### Step 1: Create LINE Official Account

This MCP server utilizes a LINE Official Account. If you do not have one, please create it by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#create-oa).

If you have a LINE Official Account, enable the Messaging API for your LINE Official Account by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-started/#using-oa-manager).


### Step 2: Build line-bot-mcp-server image

Clone this repository:

```
git clone git@github.com:line/line-bot-mcp-server.git
```

Build the Docker image:

```
docker build -t line/line-bot-mcp-server .
```

### Step 3: Configure AI Agent

Please add the following configuration for an AI Agent like Claude Desktop or Cline.

Set the environment variables or arguments as follows:

- `mcpServers.args`: (required) The path to `line-bot-mcp-server`.
- `CHANNEL_ACCESS_TOKEN`: (required) Channel Access Token. You can confirm this by following [this instructions](https://developers.line.biz/en/docs/basics/channel-access-token/#long-lived-channel-access-token).
- `DESTINATION_USER_ID`: (optional) The default user ID of the recipient. If the Tool's input does not include `user_id`, `DESTINATION_USER_ID` is required.
You can confirm this by following [this instructions](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id).


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

## Local Development with Inspector

You can use the MCP Inspector to test and debug the server locally.

### Prerequisites

1. Clone the repository:
```bash
git clone git@github.com:line/line-bot-mcp-server.git
cd line-bot-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Run the Inspector

After building the project, you can start the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This will start the MCP Inspector interface where you can interact with the LINE Bot MCP Server tools and test their functionality.

## Versioning

This project respects semantic versioning

See http://semver.org/

## Contributing

Please check [CONTRIBUTING](./CONTRIBUTING.md) before making a contribution.
