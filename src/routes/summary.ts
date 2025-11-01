import { Router, Request, Response } from 'express';
import { renderTemplate, getAssets } from '../services/renderer.js';
import { htmlToPdf } from '../services/gotenberg.js';
import { formatDateReadable } from '../utils/formatters.js';
import { sortOrders } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/pdf/summary
 * Generate Feuille de synthèse PDF
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { meta, tour, orders, sort_mode } = req.body;
    
    // Validate required fields
    if (!meta || !tour || !Array.isArray(orders)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: meta, tour, orders'
      });
    }
    
    if (!meta.date || !tour.type || !tour.type.nom) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: meta.date, tour.type.nom'
      });
    }
    
    // Format date if not provided
    const formattedMeta = {
      date: meta.date,
      date_formatted: meta.date_formatted || formatDateReadable(meta.date)
    };
    
    // Sort orders
    const sortedOrders = sortOrders(orders, sort_mode || 'numero');
    
    // Prepare template data
    const templateData = {
      meta: formattedMeta,
      tour,
      orders: sortedOrders
    };
    
    logger.info('Generating summary PDF', {
      date: meta.date,
      tourType: tour.type.nom,
      ordersCount: orders.length,
      sortMode: sort_mode || 'numero'
    });
    
    // Render template
    const html = await renderTemplate('summary.html', templateData);
    
    // Get assets (logo)
    const assets = await getAssets();
    
    // Generate PDF
    const pdfBuffer = await htmlToPdf(html, assets);
    
    const duration = Date.now() - startTime;
    logger.info('Summary PDF generated successfully', {
      date: meta.date,
      tourType: tour.type.nom,
      pdfSize: pdfBuffer.length,
      duration
    });
    
    // Set response headers
    const filename = `summary-${meta.date}-${tour.type.nom.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Summary PDF generation failed', {
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
