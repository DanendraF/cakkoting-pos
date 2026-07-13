/**
 * Type declarations for midtrans-client
 * Package does not ship its own @types, so we declare them here.
 */
declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
    [key: string]: unknown;
  }

  interface NotificationResult {
    transaction_status: string;
    order_id: string;
    fraud_status?: string;
    payment_type?: string;
    transaction_id?: string;
    transaction_time?: string;
    gross_amount?: string;
    status_code?: string;
    [key: string]: unknown;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: Record<string, unknown>): Promise<TransactionResult>;
  }

  class CoreApi {
    constructor(config: SnapConfig);
    transaction: {
      notification(notification: Record<string, unknown>): Promise<NotificationResult>;
    };
  }
}
