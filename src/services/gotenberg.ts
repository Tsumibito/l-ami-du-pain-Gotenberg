import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger.js';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg:3000';
const GENERATION_TIMEOUT = parseInt(process.env.PDF_GENERATION_TIMEOUT || '30000', 10);

/**
 * Check if Gotenberg service is healthy
 */
export async function checkGotenbergHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${GOTENBERG_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    logger.error('Gotenberg health check failed', { error });
    return false;
  }
}

/**
 * Convert HTML to PDF using Gotenberg
 */
export async function htmlToPdf(html: string, assets?: Record<string, string>): Promise<Buffer> {
  try {
    const formData = new FormData();
    
    // Add HTML file
    formData.append('files', Buffer.from(html, 'utf-8'), {
      filename: 'index.html',
      contentType: 'text/html'
    });
    
    // Add assets (e.g., logo)
    if (assets) {
      for (const [filename, content] of Object.entries(assets)) {
        formData.append('files', Buffer.from(content, 'utf-8'), {
          filename,
          contentType: filename.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'
        });
      }
    }
    
    // Gotenberg options
    formData.append('marginTop', '0');
    formData.append('marginBottom', '0');
    formData.append('marginLeft', '0');
    formData.append('marginRight', '0');
    formData.append('preferCssPageSize', 'true');
    formData.append('printBackground', 'true');
    
    const response = await axios.post(
      `${GOTENBERG_URL}/forms/chromium/convert/html`,
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
        timeout: GENERATION_TIMEOUT,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    logger.info('PDF generated successfully', {
      size: response.data.length,
      duration: response.headers['x-response-time']
    });
    
    return Buffer.from(response.data);
  } catch (error: any) {
    logger.error('PDF generation failed', {
      error: error.message,
      gotenbergUrl: GOTENBERG_URL
    });
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Gotenberg service is unavailable');
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('PDF generation timed out');
    }
    
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}
