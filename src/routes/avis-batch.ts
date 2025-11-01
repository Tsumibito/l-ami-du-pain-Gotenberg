import { Router, Request, Response } from 'express';
import { renderTemplate } from '../services/renderer.js';
import { htmlToPdf } from '../services/gotenberg.js';
import { formatDateParis, formatYMD } from '../utils/formatters.js';
import { paginateOrderLines } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/pdf/avis-batch
 * Generate batch PDF from multiple avis orders
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { orders } = req.body;
    
    // Validate required fields
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orders array is required and must not be empty'
      });
    }

    logger.info(`Generating batch PDF for ${orders.length} orders`);

    // Process each order and collect all pages
    const allPages: any[] = [];
    
    for (const orderData of orders) {
      const { company, order, lignes } = orderData;
      
      if (!company || !order || !Array.isArray(lignes)) {
        logger.warn(`Skipping invalid order: ${JSON.stringify(orderData)}`);
        continue;
      }

      // Format dates
      const orderWithFormattedDates = {
        ...order,
        date_created_formatted: order.date_created ? formatDateParis(order.date_created) : '',
        date_livraison_formatted: order.date_livraison ? formatYMD(order.date_livraison) : ''
      };

      // Paginate lines
      const orderPages = paginateOrderLines(lignes, !!order.demandes_speciales);
      
      // Add company and order data to each page
      const pagesWithData = orderPages.map(page => ({
        ...page,
        company,
        order: orderWithFormattedDates
      }));

      // Add all pages from this order to the batch
      allPages.push(...pagesWithData);
    }

    if (allPages.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid orders found in batch'
      });
    }

    // Render HTML with all pages
    const html = await renderTemplate('avis.html', { pages: allPages });
    
    // Generate PDF
    const pdfBuffer = await htmlToPdf(html);
    
    const duration = Date.now() - startTime;
    logger.info(`Batch PDF generated successfully`, {
      ordersCount: orders.length,
      pagesCount: allPages.length,
      duration: `${duration}ms`,
      size: `${(pdfBuffer.length / 1024).toFixed(2)}KB`
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bons-de-livraison-batch.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Batch PDF generation failed', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate batch PDF',
      details: error.message
    });
  }
});

export default router;
