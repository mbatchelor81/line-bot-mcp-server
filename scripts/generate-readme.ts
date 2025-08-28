#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ToolDescription {
  en: string;
  ja: string;
}

interface ToolInfo {
  name: string;
  description: ToolDescription;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

function parseToolDescriptions(fileContent: string): ToolDescription | null {
  const enMatch = fileContent.match(/\/\/ en: (.+?)$/m);
  const jaMatch = fileContent.match(/\/\/ ja: (.+?)$/m);
  
  if (enMatch && jaMatch) {
    return {
      en: enMatch[1].trim(),
      ja: jaMatch[1].trim()
    };
  }
  
  return null;
}

function extractToolNameFromFile(fileContent: string): string | null {
  const toolMatch = fileContent.match(/server\.tool\(\s*["']([^"']+)["']/);
  return toolMatch ? toolMatch[1] : null;
}

function extractInputsFromFile(fileContent: string): Array<{
  name: string;
  type: string;
  required: boolean;
  description: string;
}> {
  const inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }> = [];

  const schemaMatches = fileContent.matchAll(/(\w+):\s*(\w+Schema)/g);
  for (const match of schemaMatches) {
    const inputName = match[1];
    const schemaName = match[2];
    
    let description = '';
    let isRequired = true;
    let type = 'string';

    const describeMatch = fileContent.match(new RegExp(`${schemaName}[\\s\\S]*?\\.describe\\(\\s*["']([^"']+)["']`));
    if (describeMatch) {
      description = describeMatch[1];
    }

    const defaultMatch = fileContent.match(new RegExp(`${schemaName}[\\s\\S]*?\\.default\\(`));
    if (defaultMatch) {
      isRequired = false;
    }

    if (schemaName.includes('text') || schemaName.includes('Text')) {
      type = 'object';
      description = description || 'The text message content to send.';
    } else if (schemaName.includes('flex') || schemaName.includes('Flex')) {
      type = 'object';
      description = description || 'The flex message content to send.';
    } else if (schemaName.includes('Id')) {
      type = 'string';
    }

    inputs.push({
      name: inputName,
      type,
      required: isRequired,
      description
    });
  }

  return inputs;
}

async function extractToolInfo(): Promise<ToolInfo[]> {
  const toolsDir = path.join(__dirname, '../src/tools');
  const toolFiles = fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('.ts') && file !== 'AbstractTool.ts');

  const allTools: ToolInfo[] = [];

  for (const toolFile of toolFiles) {
    try {
      const toolPath = path.join(toolsDir, toolFile);
      const fileContent = fs.readFileSync(toolPath, 'utf-8');
      
      const toolName = extractToolNameFromFile(fileContent);
      const descriptions = parseToolDescriptions(fileContent);
      const inputs = extractInputsFromFile(fileContent);

      if (toolName && descriptions) {
        allTools.push({
          name: toolName,
          description: descriptions,
          inputs
        });
      }
    } catch (error) {
      console.warn(`Failed to process tool ${toolFile}:`, error.message);
    }
  }

  return allTools.sort((a, b) => a.name.localeCompare(b.name));
}

function generateToolsSection(tools: ToolInfo[], language: 'en' | 'ja'): string {
  let section = '';
  
  tools.forEach((tool, index) => {
    section += `${index + 1}. **${tool.name}**\n`;
    section += `   - ${tool.description[language]}\n`;
    
    if (tool.inputs.length > 0) {
      section += `   - **${language === 'en' ? 'Inputs' : '入力'}:**\n`;
      tool.inputs.forEach(input => {
        const requiredText = input.required ? '' : '?';
        section += `     - \`${input.name}\` (${input.type}${requiredText}): ${input.description}\n`;
      });
    } else {
      section += `   - **${language === 'en' ? 'Inputs' : '入力'}:**\n`;
      section += `     - ${language === 'en' ? 'None' : 'なし'}\n`;
    }
    section += '\n';
  });
  
  return section.trim();
}

async function generateReadmes() {
  try {
    const tools = await extractToolInfo();
    
    if (tools.length === 0) {
      console.error('No tools found! Check that tool files have the required comment format.');
      process.exit(1);
    }
    
    const enTemplate = fs.readFileSync(
      path.join(__dirname, '../templates/README.template.md'),
      'utf-8'
    );
    const jaTemplate = fs.readFileSync(
      path.join(__dirname, '../templates/README.ja.template.md'),
      'utf-8'
    );
    
    const enToolsSection = generateToolsSection(tools, 'en');
    const jaToolsSection = generateToolsSection(tools, 'ja');
    
    const enReadme = enTemplate.replace('{{TOOLS_SECTION}}', enToolsSection);
    const jaReadme = jaTemplate.replace('{{TOOLS_SECTION}}', jaToolsSection);
    
    fs.writeFileSync(path.join(__dirname, '../README.md'), enReadme);
    fs.writeFileSync(path.join(__dirname, '../README.ja.md'), jaReadme);
    
    console.log(`README files generated successfully! Found ${tools.length} tools.`);
  } catch (error) {
    console.error('Failed to generate README files:', error);
    process.exit(1);
  }
}

generateReadmes();
