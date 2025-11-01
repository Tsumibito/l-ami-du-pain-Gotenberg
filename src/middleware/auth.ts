import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const API_TOKEN = process.env.API_TOKEN;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if API_TOKEN is configured
  if (!API_TOKEN || API_TOKEN === 'your_secure_api_token_here_change_this') {
    logger.error('API_TOKEN not configured properly');
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'API authentication is not configured'
    });
  }

  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Missing Authorization header', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
  }

  // Check Bearer token format
  const [scheme, token] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    logger.warn('Invalid Authorization header format', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <token>'
    });
  }

  // Validate token
  if (token !== API_TOKEN) {
    logger.warn('Invalid API token', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API token'
    });
  }

  // Token is valid, proceed
  next();
};
