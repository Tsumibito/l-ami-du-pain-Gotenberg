import { Router, Request, Response } from 'express';
import { renderTemplate, getAssets } from '../services/renderer.js';
import { htmlToPdf } from '../services/gotenberg.js';
import { formatDateTimeParis } from '../utils/formatters.js';
import { sortProducts } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/pdf/gotenberg/preparation
 * Generate Fiche de préparation des commandes PDF
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { meta, products } = req.body;
    
    // Validate required fields
    if (!meta || !Array.isArray(products)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: meta, products'
      });
    }
    
    if (!meta.title || !meta.selectedDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required meta fields: title, selectedDate'
      });
    }
    
    // Format printed date if not provided
    const formattedMeta = {
      ...meta,
      printedAt: meta.printedAt || new Date().toISOString(),
      printedAtFormatted: formatDateTimeParis(meta.printedAt || new Date().toISOString())
    };
    
    // Sort products according to sort mode
    const sortedProducts = sortProducts(products, meta.sortMode?.type || 'alphabetical');
    
    // Prepare products with computed totals for each delivery type
    const preparedProducts = sortedProducts.map(product => {
      const deliveryValues = meta.deliveryTypes.map((type: any) => ({
        id: type.id,
        value: product.totals?.[type.id] || 0
      }));
      
      return {
        ...product,
        deliveryValues
      };
    });
    
    // Prepare template data
    const templateData = {
      meta: formattedMeta,
      products: preparedProducts
    };
    
    logger.info('Generating preparation PDF', {
      date: meta.selectedDate,
      productsCount: products.length,
      sortMode: meta.sortMode?.type || 'alphabetical'
    });
    
    // Render template
    const html = await renderTemplate('preparation.html', templateData);
    
    // Get assets (logo)
    const assets = await getAssets();
    
    // Generate PDF
    const pdfBuffer = await htmlToPdf(html, assets);
    
    const duration = Date.now() - startTime;
    logger.info('Preparation PDF generated successfully', {
      date: meta.selectedDate,
      productsCount: products.length,
      pdfSize: pdfBuffer.length,
      duration
    });
    
    // Set response headers
    const filename = `fiche-preparation-${meta.selectedDate}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Preparation PDF generation failed', {
      error: error.message,
      duration
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'PDF generation failed',
      details: error.message
    });
  }
});

export default router;
