import { Router, Request, Response } from 'express';
import { renderTemplate, getAssets } from '../services/renderer.js';
import { htmlToPdf } from '../services/gotenberg.js';
import { formatDateParis, formatYMD } from '../utils/formatters.js';
import { paginateOrderLines } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/pdf/avis
 * Generate Bon de livraison PDF
 */
// @ts-ignore
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { company, order, lignes } = req.body;
    
    // Validate required fields
    if (!company || !order || !Array.isArray(lignes)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: company, order, lignes'
      });
    }
    
    if (!order.numero || !order.date_created || !order.date_livraison) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required order fields: numero, date_created, date_livraison'
      });
    }
    
    // Format dates
    const formattedOrder = {
      ...order,
      date_created_formatted: formatDateParis(order.date_created),
      date_livraison_formatted: formatYMD(order.date_livraison)
    };
    
    // Paginate lines
    const pages = paginateOrderLines(lignes, !!order.demandes_speciales);
    
    // Prepare template data
    const templateData = {
      company,
      order: formattedOrder,
      pages
    };
    
    logger.info('Generating avis PDF', {
      orderId: order.id,
      orderNumero: order.numero,
      linesCount: lignes.length,
      pagesCount: pages.length
    });
    
    // Render template
    const html = await renderTemplate('avis.html', templateData);
    
    // Get assets (logo)
    const assets = await getAssets();
    
    // Generate PDF
    const pdfBuffer = await htmlToPdf(html, assets);
    
    const duration = Date.now() - startTime;
    logger.info('Avis PDF generated successfully', {
      orderId: order.id,
      orderNumero: order.numero,
      pdfSize: pdfBuffer.length,
      duration
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-livraison-${order.numero}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Avis PDF generation failed', {
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
