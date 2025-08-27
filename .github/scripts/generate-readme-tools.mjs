import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function extractToolInfo() {
  const toolsDir = path.join(projectRoot, 'src/tools');
  const toolFiles = await fs.readdir(toolsDir);
  const tools = [];

  // Load schema files to get descriptions
  const textMessageSchema = await fs.readFile(path.join(projectRoot, 'src/common/schema/textMessage.ts'), 'utf8');
  const flexMessageSchema = await fs.readFile(path.join(projectRoot, 'src/common/schema/flexMessage.ts'), 'utf8');

  for (const file of toolFiles) {
    if (file === 'AbstractTool.ts' || !file.endsWith('.ts')) continue;
    
    const filePath = path.join(toolsDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract server.tool() call with better regex for multi-line strings
    const toolMatch = content.match(/server\.tool\(\s*"([^"]+)",\s*"([^"]+)"(?:\s*\+\s*"[^"]*")*,\s*\{([^}]*)\}/s);
    if (!toolMatch) continue;
    
    let [, toolName, description] = toolMatch;
    
    // Handle multi-line string concatenation in descriptions
    const fullDescMatch = content.match(/server\.tool\(\s*"[^"]+",\s*"([^"]+)"(?:\s*\+\s*"([^"]*)")*,/s);
    if (fullDescMatch) {
      description = fullDescMatch[1];
      if (fullDescMatch[2]) {
        description += fullDescMatch[2];
      }
    }
    const schemaContent = toolMatch[3];
    
    const params = [];
    
    // Extract parameters from the schema object
    const paramMatches = schemaContent.matchAll(/(\w+):\s*(\w+(?:Schema)?)/g);
    for (const match of paramMatches) {
      const [, paramName, schemaRef] = match;
      
      // Look for local schema definitions with .describe()
      const localSchemaMatch = content.match(new RegExp(`const\\s+${schemaRef}\\s*=\\s*z[^;]*\\.describe\\(\\s*"([^"]+)"\\s*\\)`));
      if (localSchemaMatch) {
        const isOptional = localSchemaMatch[1].includes('Defaults to');
        params.push({
          name: paramName,
          description: localSchemaMatch[1],
          type: 'string',
          optional: isOptional
        });
        continue;
      }
      
      // Handle imported schemas
      if (schemaRef === 'textMessageSchema') {
        const textMatch = textMessageSchema.match(/text:\s*z[^,]*\.describe\(\s*"([^"]+)"\s*\)/);
        if (textMatch) {
          params.push({
            name: 'message.text',
            description: textMatch[1],
            type: 'string',
            optional: false
          });
        }
      } else if (schemaRef === 'flexMessageSchema') {
        const altTextMatch = flexMessageSchema.match(/altText:\s*z[^,]*\.describe\(\s*"([^"]+)"\s*\)/);
        const contentsMatch = flexMessageSchema.match(/contents:\s*z[^}]*\.describe\(\s*"([^"]+)"\s*\)/);
        const typeMatch = flexMessageSchema.match(/type:\s*z[^}]*\.describe\(\s*"([^"]+)"\s*\)/);
        
        if (altTextMatch) {
          params.push({
            name: 'message.altText',
            description: altTextMatch[1],
            type: 'string',
            optional: false
          });
        }
        if (contentsMatch) {
          params.push({
            name: 'message.contents',
            description: contentsMatch[1],
            type: 'object',
            optional: false
          });
        }
        if (typeMatch) {
          params.push({
            name: 'message.contents.type',
            description: typeMatch[1],
            type: 'enum',
            optional: false
          });
        }
      }
    }
    
    tools.push({
      name: toolName,
      description: description.replace(/"\s*\+\s*"/g, ''),
      parameters: params,
      fileName: file
    });
  }
  
  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

function inferTypeFromSchema(content, schemaRef) {
  if (schemaRef.includes('textMessageSchema')) return 'object';
  if (schemaRef.includes('flexMessageSchema')) return 'object';
  if (content.includes('z.string()')) return 'string';
  if (content.includes('z.object(')) return 'object';
  return 'string';
}

function generateEnglishToolsSection(tools) {
  let section = '## Tools\n\n';
  
  tools.forEach((tool, index) => {
    section += `${index + 1}. **${tool.name}**\n`;
    section += `   - ${tool.description}\n`;
    
    if (tool.parameters.length > 0) {
      section += `   - **Inputs:**\n`;
      tool.parameters.forEach(param => {
        const optional = param.optional ? '?' : '';
        section += `     - \`${param.name}\` (${param.type}${optional}): ${param.description}\n`;
      });
    } else {
      section += `   - **Inputs:**\n     - None\n`;
    }
  });
  
  return section;
}

async function updateReadmeFiles(tools) {
  const englishSection = generateEnglishToolsSection(tools);
  
  const readmePath = path.join(projectRoot, 'README.md');
  const readmeContent = await fs.readFile(readmePath, 'utf8');
  
  const updatedReadme = readmeContent.replace(
    /## Tools\n\n[\s\S]*?(?=## Installation)/,
    englishSection + '\n'
  );
  
  await fs.writeFile(readmePath, updatedReadme);
  console.log('Updated README.md with generated tool descriptions');
  
  console.log('Note: README.ja.md requires manual translation of the updated tool descriptions');
}

async function main() {
  try {
    const tools = await extractToolInfo();
    console.log(`Found ${tools.length} tools to document`);
    
    await updateReadmeFiles(tools);
    console.log('README generation completed successfully');
  } catch (error) {
    console.error('Error generating README:', error);
    process.exit(1);
  }
}

main();
