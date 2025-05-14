import { Payment, PaymentStatus, PaymentType, TokenTransaction, TokenTransactionType, TransactionStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';
import { ParsedQs } from 'qs';

// Request Types
export interface CreatePaymentRequest extends Request {
  body: {
    guideId: number;
    amount: number;
    method?: string;
    currency?: string;
    paymentType: PaymentType;
    description?: string;
    idempotencyKey?: number;
    tariffId?: number;
  };
  user: AuthUser;
}

export interface UpdatePaymentRequest extends Request {
  body: {
    status?: PaymentStatus;
    paymentIntentId?: string;
    paymentUrl?: string;
    completedAt?: Date | string;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface CreateTokenTransactionRequest extends Request {
  body: {
    guideId: number;
    amount: number;
    type: TokenTransactionType;
    description?: string;
    paymentId?: number;
  };
  user: AuthUser;
}

// Query parameters for filtering payments
export interface PaymentQueryParams extends ParsedQs {
  guideId?: string;
  status?: string;
  paymentType?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface PaymentFilterRequest extends Request {
  query: PaymentQueryParams;
  user: AuthUser;
}

// Service Types
export interface PaymentData {
  guideId: number;
  amount: number;
  method?: string;
  currency?: string;
  status?: PaymentStatus;
  paymentType: PaymentType;
  description?: string;
  paymentIntentId?: string;
  paymentUrl?: string;
  completedAt?: Date | string;
  idempotencyKey?: number;
  tariffId?: number;
}

export interface TokenTransactionData {
  guideId: number;
  amount: number;
  type: TokenTransactionType;
  status?: TransactionStatus;
  description?: string;
  paymentId?: number;
}

// Response Types
export interface PaymentResponse extends ApiResponse<Payment | Payment[]> {}
export interface TokenTransactionResponse extends ApiResponse<TokenTransaction | TokenTransaction[]> {}

// Controller Types
export type GetPaymentsController = (req: PaymentFilterRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetPaymentByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreatePaymentController = (req: CreatePaymentRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdatePaymentController = (req: UpdatePaymentRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type ProcessPaymentController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetGuidePaymentsController = ControllerFunction;
export type GetTokenTransactionsController = ControllerFunction;
export type CreateTokenTransactionController = (req: CreateTokenTransactionRequest, res: Response, next: NextFunction) => Promise<void> | void; 