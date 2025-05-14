import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import {
  CreatePaymentController,
  GetPaymentByIdController,
  ProcessPaymentController,
  GetGuidePaymentsController,
  GetTokenTransactionsController,
  CreateTokenTransactionController,
  IdParams,
  CreatePaymentRequest,
  CreateTokenTransactionRequest
} from '../types';

// Initiate a token purchase for a guide
export const initiatePayment: CreatePaymentController = catchAsync(async (req: CreatePaymentRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can purchase tokens');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const payment = await paymentService.initiatePayment(guideId, req.body);
  
  res.status(200).json({
    status: 'success',
    data: payment
  });
});

// Get payment details
export const getPaymentDetails: GetPaymentByIdController = catchAsync(async (req: IdParams, res: Response) => {
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
    false, // isTourist
    req.user.isGuide
  );
  
  res.status(200).json({
    status: 'success',
    data: payment
  });
});

// Handle payment callback from payment provider
export const handlePaymentCallback: ProcessPaymentController = catchAsync(async (req: IdParams, res: Response) => {
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

// This endpoint is no longer relevant with the token system
export const getTouristPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  throw new BadRequestError('Operation not supported in token system');
});

// Get guide's token purchase history and current balance
export const getGuidePaymentsReceived: GetGuidePaymentsController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const result = await paymentService.getGuidePaymentsReceived(guideId);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

// Use tokens for a service/feature
export const useTokens: CreateTokenTransactionController = catchAsync(async (req: CreateTokenTransactionRequest, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Only guides can use tokens');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
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
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const balance = await paymentService.getGuideTokenBalance(guideId);
  
  res.status(200).json({
    status: 'success',
    data: balance
  });
});

// Get guide's token transaction history
export const getTokenTransactions: GetTokenTransactionsController = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.user.isGuide) {
    throw new ForbiddenError('Unauthorized access');
  }
  
  // TODO: Get guide ID from user ID
  const guideId = 1; // This is a placeholder
  
  const transactions = await paymentService.getTokenTransactionHistory(guideId);
  
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: transactions
  });
});

// These endpoints are no longer relevant with the token system
export const initiateWithdrawal = catchAsync(async (req: Request, res: Response) => {
  throw new BadRequestError('Withdrawals are not supported in token system');
});

export const getWithdrawalStatus = catchAsync(async (req: Request, res: Response) => {
  throw new BadRequestError('Withdrawals are not supported in token system');
}); 