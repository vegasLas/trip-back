import { Auction, Bid, AuctionStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, ControllerFunction, IdParams, ApiResponse } from './common';

// Request Types
export interface CreateAuctionRequest extends Request {
  body: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    numberOfPeople: number;
    budget?: number;
    expiresAt: Date | string;
    programId?: number; // Program ID if auction is for a specific program
  };
  user: AuthUser;
}

export interface UpdateAuctionRequest extends Request {
  body: {
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    numberOfPeople?: number;
    budget?: number;
    expiresAt?: Date | string;
    status?: AuctionStatus;
    programId?: number; // Program ID if auction is for a specific program
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface PlaceBidRequest extends Request {
  body: {
    price: number;
    description: string;
  };
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface AuctionParams extends Request {
  params: {
    id: string;
  };
  user: AuthUser;
}

export interface ProgramAuctionParams extends Request {
  params: {
    programId: string;
  };
  user: AuthUser;
}

// Service Types
export interface AuctionData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  numberOfPeople: number;
  budget?: number;
  expiresAt: Date | string;
  programId?: number; // Program ID if auction is for a specific program
}

export interface BidData {
  price: number;
  description: string;
}

// Response Types
export interface AuctionResponse extends ApiResponse<Auction | Auction[]> {}
export interface BidResponse extends ApiResponse<Bid> {}

// Controller Types
export type GetActiveAuctionsController = ControllerFunction;
export type GetAuctionByIdController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type CreateAuctionController = (req: CreateAuctionRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type UpdateAuctionController = (req: UpdateAuctionRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type DeleteAuctionController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type EndAuctionController = (req: IdParams, res: Response, next: NextFunction) => Promise<void> | void;
export type PlaceBidController = (req: PlaceBidRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type GetTouristBiddedAuctionsController = ControllerFunction;
export type GetTouristAuctionsController = ControllerFunction;
export type GetGuideBiddedAuctionsController = ControllerFunction;
export type GetProgramAuctionsController = (req: ProgramAuctionParams, res: Response, next: NextFunction) => Promise<void> | void; 