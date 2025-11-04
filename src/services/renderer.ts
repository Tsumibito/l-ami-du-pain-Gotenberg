import Mustache from 'mustache';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load template from file with caching
 */
async function loadTemplate(templateName: string): Promise<string> {
  // Temporarily disable cache for development
  // if (templateCache.has(templateName)) {
  //   return templateCache.get(templateName)!;
  // }
  
  const templatePath = path.join(__dirname, '../../templates', templateName);
  const content = await fs.readFile(templatePath, 'utf-8');
  
  // templateCache.set(templateName, content);
  return content;
}

/**
 * Load asset file (e.g., logo)
 */
async function loadAsset(assetPath: string): Promise<string> {
  const fullPath = path.join(__dirname, '../../templates/assets', assetPath);
  return await fs.readFile(fullPath, 'utf-8');
}

/**
 * Render Mustache template with data
 */
export async function renderTemplate(
  templateName: string,
  data: any
): Promise<string> {
  const template = await loadTemplate(templateName);
  return Mustache.render(template, data);
}

/**
 * Get assets for PDF generation
 */
export async function getAssets(): Promise<Record<string, string>> {
  try {
    const logo = await loadAsset('ladp_logo.svg');
    return {
      'ladp_logo.svg': logo
    };
  } catch (error) {
    // Logo is optional, return empty if not found
    return {};
  }
}
