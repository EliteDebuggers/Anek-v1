import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokenHelper.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback to token in cookies (via cookie-parser)
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    const decoded = verifyAccessToken(token);

    // Fetch user and ensure they exist and are not soft-deleted
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (!user) {
      res.status(401);
      return next(new Error('Not authorized, user not found or has been deleted'));
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token validation failed'));
  }
};

export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};
