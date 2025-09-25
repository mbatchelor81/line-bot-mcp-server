#!/usr/bin/env tsx

/**
 * Copyright 2025 LY Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ToolInfo {
  name: string;
  description: string;
  inputs: InputParam[];
}

interface InputParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

function extractToolsFromFile(filePath: string): ToolInfo[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const tools: ToolInfo[] = [];

  const toolRegex = /server\.tool\(\s*"([^"]+)",\s*"([^"]*(?:\\.[^"]*)*)"(?:\s*\+\s*"([^"]*(?:\\.[^"]*)*)")*,\s*\{([^}]*)\},/gs;
  let match;

  while ((match = toolRegex.exec(content)) !== null) {
    const [, toolName, description1, description2, inputsStr] = match;
    
    let fullDescription = description1.replace(/\\"/g, '"');
    if (description2) {
      fullDescription += description2.replace(/\\"/g, '"');
    }
    
    const inputs = parseInputs(inputsStr.trim(), content);
    
    tools.push({
      name: toolName,
      description: fullDescription,
      inputs,
    });
  }

  return tools;
}

function parseInputs(inputsStr: string, fullContent: string): InputParam[] {
  if (!inputsStr || inputsStr === "") {
    return [];
  }

  const inputs: InputParam[] = [];
  
  const inputPairs = splitInputs(inputsStr);
  
  for (const pair of inputPairs) {
    const colonIndex = pair.indexOf(":");
    if (colonIndex === -1) continue;
    
    const key = pair.substring(0, colonIndex).trim();
    const value = pair.substring(colonIndex + 1).trim();
    
    const input = parseInputParam(key, value, fullContent);
    if (input) {
      inputs.push(input);
    }
  }

  return inputs;
}

function splitInputs(inputsStr: string): string[] {
  const inputs: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < inputsStr.length; i++) {
    const char = inputsStr[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === "\\") {
      escapeNext = true;
      current += char;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === "{" || char === "(") {
        depth++;
      } else if (char === "}" || char === ")") {
        depth--;
      } else if (char === "," && depth === 0) {
        inputs.push(current.trim());
        current = "";
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    inputs.push(current.trim());
  }
  
  return inputs;
}

function parseInputParam(key: string, value: string, fullContent: string): InputParam | null {
  if (value.includes("textMessageSchema")) {
    return parseTextMessageSchema(key);
  }
  
  if (value.includes("flexMessageSchema")) {
    return parseFlexMessageSchema(key);
  }
  
  const describeMatch = value.match(/\.describe\(\s*"([^"]*(?:\\.[^"]*)*)"\s*\)/g);
  let description = "";
  if (describeMatch) {
    const lastDescribe = describeMatch[describeMatch.length - 1];
    const match = lastDescribe.match(/\.describe\(\s*"([^"]*(?:\\.[^"]*)*)"\s*\)/);
    if (match) {
      description = match[1].replace(/\\"/g, '"');
    }
  }
  
  const isOptional = value.includes(".optional()") || value.includes(".default(");
  
  const defaultMatch = value.match(/\.default\(\s*([^)]+)\s*\)/);
  const defaultValue = defaultMatch ? defaultMatch[1] : undefined;
  
  let type = "string";
  if (value.includes("z.string()")) {
    type = "string";
  } else if (value.includes("z.number()")) {
    type = "number";
  } else if (value.includes("z.boolean()")) {
    type = "boolean";
  } else if (value.includes("z.object(")) {
    type = "object";
  }
  
  if (isOptional) {
    type += "?";
  }

  return {
    name: key,
    type,
    description,
    optional: isOptional,
    defaultValue,
  };
}

function parseTextMessageSchema(key: string): InputParam {
  return {
    name: key,
    type: "object",
    description: "Text message object",
    optional: false,
  };
}

function parseFlexMessageSchema(key: string): InputParam {
  return {
    name: key,
    type: "object", 
    description: "Flex message object",
    optional: false,
  };
}

function expandMessageSchema(schemaName: string): InputParam[] {
  if (schemaName === "textMessageSchema") {
    return [
      {
        name: "message.text",
        type: "string",
        description: "The plain text content to send to the user.",
        optional: false,
      },
    ];
  }
  
  if (schemaName === "flexMessageSchema") {
    return [
      {
        name: "message.altText",
        type: "string", 
        description: "Alternative text shown when flex message cannot be displayed.",
        optional: false,
      },
      {
        name: "message.contents",
        type: "object",
        description: "The content of the flex message. This is a JSON object that defines the layout and components of the message.",
        optional: false,
      },
      {
        name: "message.contents.type",
        type: "enum",
        description: "Type of the container. 'bubble' for single container, 'carousel' for multiple swipeable bubbles.",
        optional: false,
      },
    ];
  }
  
  return [];
}

function getAllTools(): ToolInfo[] {
  const toolsDir = path.join(__dirname, "../src/tools");
  const toolFiles = fs.readdirSync(toolsDir).filter(file => 
    file.endsWith(".ts") && file !== "AbstractTool.ts"
  );

  const allTools: ToolInfo[] = [];
  
  for (const file of toolFiles) {
    const filePath = path.join(toolsDir, file);
    const tools = extractToolsFromFile(filePath);
    allTools.push(...tools);
  }

  const toolOrder = [
    "push_text_message",
    "push_flex_message", 
    "broadcast_text_message",
    "broadcast_flex_message",
    "get_profile",
    "get_message_quota",
    "get_rich_menu_list",
    "delete_rich_menu",
    "set_rich_menu_default",
    "cancel_rich_menu_default",
  ];

  return allTools.sort((a, b) => {
    const aIndex = toolOrder.indexOf(a.name);
    const bIndex = toolOrder.indexOf(b.name);
    return aIndex - bIndex;
  });
}

function generateEnglishToolsSection(tools: ToolInfo[]): string {
  let output = "## Tools\n\n";
  
  tools.forEach((tool, index) => {
    output += `${index + 1}. **${tool.name}**\n`;
    output += `   - ${tool.description}\n`;
    
    const expandedInputs = getExpandedInputs(tool);
    
    if (expandedInputs.length > 0) {
      output += `   - **Inputs:**\n`;
      expandedInputs.forEach(input => {
        const typeStr = input.optional ? `${input.type}?` : input.type;
        const defaultStr = input.defaultValue ? ` Defaults to ${input.defaultValue}.` : "";
        const requiredStr = getRequiredString(input, tool.name);
        output += `     - \`${input.name}\` (${typeStr}): ${input.description}${defaultStr}${requiredStr}\n`;
      });
    } else {
      output += `   - **Inputs:**\n`;
      output += `     - None\n`;
    }
  });

  return output;
}

function generateJapaneseToolsSection(tools: ToolInfo[]): string {
  let output = "## Tools\n\n";
  
  tools.forEach((tool, index) => {
    output += `${index + 1}. **${tool.name}**\n`;
    output += `   - ${getJapaneseDescription(tool.name, tool.description)}\n`;
    
    const expandedInputs = getExpandedInputs(tool);
    
    if (expandedInputs.length > 0) {
      output += `   - **入力:**\n`;
      expandedInputs.forEach(input => {
        const typeStr = input.optional ? `${input.type}?` : input.type;
        const defaultStr = input.defaultValue ? ` デフォルトは${getJapaneseDefault(input.defaultValue)}。` : "";
        const requiredStr = getJapaneseRequiredString(input, tool.name);
        output += `     - \`${input.name}\` (${typeStr}): ${getJapaneseInputDescription(input.name, input.description)}${defaultStr}${requiredStr}\n`;
      });
    } else {
      output += `   - **入力:**\n`;
      output += `     - なし\n`;
    }
  });

  return output;
}

function getExpandedInputs(tool: ToolInfo): InputParam[] {
  const expandedInputs: InputParam[] = [];
  
  for (const input of tool.inputs) {
    if (input.name === "message" && input.type === "object") {
      if (tool.name.includes("text")) {
        expandedInputs.push(...expandMessageSchema("textMessageSchema"));
      } else if (tool.name.includes("flex")) {
        expandedInputs.push(...expandMessageSchema("flexMessageSchema"));
      }
    } else if (input.name === "userId") {
      expandedInputs.push({
        ...input,
        name: "user_id",
        description: "The user ID to receive a message. Defaults to DESTINATION_USER_ID.",
      });
    } else {
      expandedInputs.push(input);
    }
  }
  
  return expandedInputs;
}

function getRequiredString(input: InputParam, toolName: string): string {
  if (input.name === "user_id") {
    return " Either `user_id` or `DESTINATION_USER_ID` must be set.";
  }
  return "";
}

function getJapaneseRequiredString(input: InputParam, toolName: string): string {
  if (input.name === "user_id") {
    return " `user_id`または`DESTINATION_USER_ID`のどちらか一方は必ず設定する必要があります。";
  }
  return "";
}

function getJapaneseDescription(toolName: string, englishDescription: string): string {
  const descriptions: Record<string, string> = {
    "push_text_message": "LINEでユーザーにシンプルなテキストメッセージを送信する。",
    "push_flex_message": "LINEでユーザーに高度にカスタマイズ可能なフレックスメッセージを送信する。",
    "broadcast_text_message": "LINE公式アカウントと友だちになっているすべてのユーザーに、LINEでシンプルなテキストメッセージを送信する。",
    "broadcast_flex_message": "LINE公式アカウントと友だちになっているすべてのユーザーに、LINEで高度にカスタマイズ可能なフレックスメッセージを送信する。",
    "get_profile": "LINEユーザーの詳細なプロフィール情報を取得する。表示名、プロフィール画像URL、ステータスメッセージ、言語を取得できる。",
    "get_message_quota": "LINE公式アカウントのメッセージ容量と消費量を取得します。月間メッセージ制限と現在の使用量が表示されます。",
    "get_rich_menu_list": "LINE公式アカウントに登録されているリッチメニューの一覧を取得する。",
    "delete_rich_menu": "LINE公式アカウントからリッチメニューを削除する。",
    "set_rich_menu_default": "リッチメニューをデフォルトとして設定する。",
    "cancel_rich_menu_default": "デフォルトのリッチメニューを解除する。",
  };
  
  return descriptions[toolName] || englishDescription;
}

function getJapaneseInputDescription(inputName: string, englishDescription: string): string {
  const descriptions: Record<string, string> = {
    "user_id": "メッセージ受信者のユーザーID。デフォルトはDESTINATION_USER_ID。",
    "message.text": "ユーザーに送信するテキスト。",
    "message.altText": "フレックスメッセージが表示できない場合に表示される代替テキスト。",
    "message.contents": "フレックスメッセージの内容。メッセージのレイアウトとコンポーネントを定義するJSONオブジェクト。",
    "message.contents.type": "コンテナのタイプ。'bubble'は単一コンテナ、'carousel'は複数のスワイプ可能なバブルを示す。",
    "richMenuId": "リッチメニューのID。",
  };
  
  return descriptions[inputName] || englishDescription;
}

function getJapaneseDefault(defaultValue: string): string {
  if (defaultValue === "this.destinationId") {
    return "DESTINATION_USER_ID";
  }
  return defaultValue;
}

function updateReadmeFile(filePath: string, newToolsSection: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  
  const toolsSectionRegex = /## Tools\n\n[\s\S]*?(?=\n## |$)/;
  const updatedContent = content.replace(toolsSectionRegex, newToolsSection);
  
  fs.writeFileSync(filePath, updatedContent);
}

function main(): void {
  console.log("Generating tool descriptions from source code...");
  
  const tools = getAllTools();
  console.log(`Found ${tools.length} tools`);
  
  const englishSection = generateEnglishToolsSection(tools);
  const englishReadmePath = path.join(__dirname, "../README.md");
  updateReadmeFile(englishReadmePath, englishSection);
  console.log("Updated README.md");
  
  const japaneseSection = generateJapaneseToolsSection(tools);
  const japaneseReadmePath = path.join(__dirname, "../README.ja.md");
  updateReadmeFile(japaneseReadmePath, japaneseSection);
  console.log("Updated README.ja.md");
  
  console.log("Tool descriptions generated successfully!");
}

main();
