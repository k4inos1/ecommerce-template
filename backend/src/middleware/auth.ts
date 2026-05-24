import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      [key: string]: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: Express.User;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
