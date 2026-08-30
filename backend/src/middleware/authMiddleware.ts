import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/AuthService';
import { UserRole } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const createAuthMiddleware = (authService: AuthService) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication token is missing.' },
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`
      });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
      next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: { code: err.code || 'UNAUTHORIZED', message: err.message || 'Invalid token.' },
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`
      });
    }
  };
};

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User is not authenticated.' },
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource.' },
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`
      });
    }

    next();
  };
};
