import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { Tracer } from 'opentracing';
import { RequestWithId } from '../middleware/logging';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export interface Context {
  userId?: string;
  token?: string;
  tracer: Tracer;
  span?: any;
  requestId?: string;
}

export async function createContext(req: any, tracer: Tracer): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const requestId = (req as RequestWithId).requestId;
  
  const span = tracer.startSpan('graphql-request');
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  if (requestId) {
    span.setTag('request.id', requestId);
  }

  if (!token) {
    return { tracer, span, requestId };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    span.setTag('user.id', decoded.userId);
    return {
      userId: decoded.userId,
      token,
      tracer,
      span,
      requestId,
    };
  } catch (error) {
    console.error('Invalid token:', error);
    return { tracer, span, requestId };
  }
}
