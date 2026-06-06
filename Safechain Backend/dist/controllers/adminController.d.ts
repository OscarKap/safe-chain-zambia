import { Request, Response } from 'express';
export declare const createAdminRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const approveAdminRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const rejectAdminRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingRequests: (req: Request, res: Response) => Promise<void>;
export declare const getAllAdminUsers: (req: Request, res: Response) => Promise<void>;
export declare const suspendAdminUser: (req: Request, res: Response) => Promise<void>;
export declare const reactivateAdminUser: (req: Request, res: Response) => Promise<void>;
export declare const getActivityLogs: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map