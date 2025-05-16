import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import * as userService from '../services/userService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  IdParams,
  CreatePaymentRequest,
  CreateTokenTransactionRequest
} from '../types';

// Helper function to get guide ID from user ID
const getGuideIdFromUser = async (userId: number): Promise<number> => {
  const user = await userService.getUserProfile(userId);
  if (!user.guide) {
    throw new BadRequestError('User is not a guide');
  }
  return user.guide.id;
};

// Initiate a token purchase for a guide
export const initiatePayment = catchAsync(async (req: CreatePaymentRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can purchase tokens');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const payment = await paymentService.initiatePayment(guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: payment
  });
});

// Get payment details
export const getPaymentDetails = catchAsync(async (req: IdParams, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  const paymentId = parseInt(req.params.id);
  
  if (isNaN(paymentId)) {
    throw new BadRequestError('Invalid payment ID');
  }
  
  const payment = await paymentService.getPaymentDetails(
    paymentId,
    req.user.id,
    req.user.isGuide
  );
  
  res.status(200).json({
    status: 'success',
    data: payment
  });
});

// Handle payment callback from payment provider
export const handlePaymentCallback = catchAsync(async (req: IdParams, res: Response) => {
  const paymentId = parseInt(req.params.id);
  
  if (isNaN(paymentId)) {
    throw new BadRequestError('Invalid payment ID');
  }
  
  const result = await paymentService.processPaymentCallback(paymentId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});


// Get guide's token purchase history and current balance
export const getGuidePaymentsReceived = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const result = await paymentService.getGuidePaymentsReceived(guideId);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// Use tokens for a service/feature
export const useTokens = catchAsync(async (req: CreateTokenTransactionRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can use tokens');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const result = await paymentService.useTokens(guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// Get guide's current token balance
export const getTokenBalance = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const balance = await paymentService.getGuideTokenBalance(guideId);
  
  res.status(200).json({
    status: 'success',
    data: balance
  });
});

// Get guide's token transaction history
export const getTokenTransactions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // Get guide ID from user ID
  const guideId = await getGuideIdFromUser(req.user.id);
  
  const transactions = await paymentService.getTokenTransactionHistory(guideId);
  
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: transactions
  });
});
