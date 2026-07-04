import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/tokenHelper.js';
import { serializeUser } from '../utils/responseSerializer.js';

/**
 * Login or Auto-Register User.
 * Supports standard logins and auto-registration for simplified frontend flows.
 * @route   POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  const { username, name, password } = req.body;
  const lowercaseUsername = username.trim().toLowerCase();

  try {
    let user = await User.findOne({ username: lowercaseUsername, isDeleted: false });

    if (user) {
      if (password && user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          res.status(401);
          return next(new Error('Invalid username or password'));
        }
      }

      if (name && user.name.toLowerCase() !== name.trim().toLowerCase()) {
        res.status(400);
        return next(new Error('Username already taken or invalid name match'));
      }
    } else {
      const userData = {
        name: name ? name.trim() : 'Citizen',
        username: lowercaseUsername,
        points: 0,
      };

      if (password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(password, salt);
      }

      user = await User.create(userData);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: serializeUser(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a User.
 * @route   POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  const { name, username, password } = req.body;
  const lowercaseUsername = username.trim().toLowerCase();

  try {
    const userExists = await User.findOne({ username: lowercaseUsername, isDeleted: false });
    if (userExists) {
      res.status(400);
      return next(new Error('Username is already taken'));
    }

    const userData = {
      name: name.trim(),
      username: lowercaseUsername,
      points: 0,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.create(userData);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: serializeUser(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token.
 * @route   POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  let token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    res.status(401);
    return next(new Error('Refresh token not provided'));
  }

  try {
    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      res.status(401);
      return next(new Error('Invalid or revoked refresh token'));
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.status(401);
      return next(new Error('Refresh token has expired'));
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findOne({ _id: decoded.id, isDeleted: false });

    if (!user) {
      res.status(401);
      return next(new Error('User not found or deleted'));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await RefreshToken.deleteOne({ _id: storedToken._id });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401);
    next(new Error('Invalid refresh token'));
  }
};

/**
 * Logout User.
 * @route   POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  try {
    if (token) {
      await RefreshToken.deleteOne({ token });
    }

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
