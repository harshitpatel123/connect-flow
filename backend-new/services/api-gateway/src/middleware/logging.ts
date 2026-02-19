import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function loggingMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  // Generate or extract request ID
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Add request ID to response headers
  res.setHeader('x-request-id', req.requestId);
  
  const start = Date.now();
  
  console.log(`[${req.requestId}] --> ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.requestId}] <-- ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}
