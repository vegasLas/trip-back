import { Tariff, Bid } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';

// Tariff Types
export interface CreateTariffRequest extends Request {
  body: {
    amount: number;
    pricePerUnit: number;
    totalPrice?: number;
    isActive?: boolean;
  };
  user: AuthUser;
}

export interface UpdateTariffRequest extends Request {
  body: {
    amount?: number;
    pricePerUnit?: number;
    totalPrice?: number;
    isActive?: boolean;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface TariffData {
  amount: number;
  pricePerUnit: number;
  totalPrice?: number;
  isActive?: boolean;
}

export interface TariffResponse extends ApiResponse<Tariff | Tariff[]> {}

// Bid Types
export interface CreateBidRequest extends Request {
  body: {
    auctionId: number;
    price: number;
    description: string;
  };
  user: AuthUser;
}

export interface UpdateBidRequest extends Request {
  body: {
    price?: number;
    description?: string;
    isAccepted?: boolean;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface GuideBidData {
  auctionId: number;
  guideId: number;
  price: number;
  description: string;
  isAccepted?: boolean;
}

export interface GuideBidResponse extends ApiResponse<Bid | Bid[]> {}

// Controller Types - Tariff
export type GetTariffsController = ControllerFunction;
export type GetTariffByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateTariffController = (req: CreateTariffRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateTariffController = (req: UpdateTariffRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteTariffController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type PurchaseTariffController = (
  req: Request & { body: { tariffId: number, paymentMethod: string } },
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Controller Types - Bid
export type GetBidsController = ControllerFunction;
export type GetBidByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateBidController = (req: CreateBidRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateBidController = (req: UpdateBidRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteBidController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type AcceptBidController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type GetGuideBidsController = ControllerFunction;
export type GetAuctionBidsController = (
  req: Request & { params: { auctionId: string } },
  res: Response,
  next: NextFunction
) => Promise<void> | void; 