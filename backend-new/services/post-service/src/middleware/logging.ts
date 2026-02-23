import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId?: string;
}

export function loggingMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('x-request-id', req.requestId);
  
  const start = Date.now();
  console.log(`[POST-SERVICE] [${req.requestId}] --> ${req.method} ${req.originalUrl}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`[POST-SERVICE] [${req.requestId}] <-- ${req.method} ${req.originalUrl} - ${res.statusCode} ${statusEmoji} - ${duration}ms`);
  });

  next();
}
