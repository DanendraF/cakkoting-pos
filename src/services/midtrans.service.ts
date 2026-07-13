import MidtransClient from 'midtrans-client';

interface SnapTokenInput {
  orderId: string;
  grossAmount: number;
  customerName: string;
  tableNumber: number;
  items: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

interface SnapTokenResult {
  token: string;
  redirectUrl: string;
}

interface MidtransNotification {
  transaction_status?: string;
  order_id?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;
  gross_amount?: string;
  status_code?: string;
  [key: string]: unknown;
}

export class MidtransService {
  private static snap = new MidtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
  });

  private static coreApi = new MidtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
  });

  /**
   * Creates a Midtrans Snap payment token.
   * Returns { token, redirectUrl } to be passed to Snap.js on frontend.
   */
  static async createSnapToken(input: SnapTokenInput): Promise<SnapTokenResult> {
    const { orderId, grossAmount, customerName, tableNumber, items } = input;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: customerName || `Meja ${tableNumber}`,
      },
      item_details: items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name.substring(0, 50), // Midtrans max 50 chars
      })),
      callbacks: {
        finish: `${process.env.CORS_ORIGIN}/order/${orderId}`,
        error: `${process.env.CORS_ORIGIN}/payment-failed?order=${orderId}`,
        pending: `${process.env.CORS_ORIGIN}/order/${orderId}`,
      },
      // Enabled payment methods for QRIS + e-wallets
      enabled_payments: [
        'qris',
        'gopay',
        'shopeepay',
        'dana',
        'ovo',
        'linkaja',
      ],
    };

    const response = await MidtransService.snap.createTransaction(parameter);
    return {
      token: response.token as string,
      redirectUrl: response.redirect_url as string,
    };
  }

  /**
   * Verifies a webhook notification from Midtrans.
   * Throws if signature key is invalid.
   */
  static async verifyNotification(
    notification: MidtransNotification
  ): Promise<{
    orderId: string;
    transactionStatus: string;
    paymentType: string;
    transactionId: string;
    transactionTime: Date;
    fraudStatus: string;
  }> {
    // Midtrans SDK handles signature verification internally
    const statusResponse =
      await MidtransService.coreApi.transaction.notification(notification);

    const transactionStatus = statusResponse.transaction_status as string;
    const fraudStatus = (statusResponse.fraud_status as string) ?? 'accept';

    return {
      orderId: statusResponse.order_id as string,
      transactionStatus,
      paymentType: (statusResponse.payment_type as string) ?? '',
      transactionId: (statusResponse.transaction_id as string) ?? '',
      transactionTime: new Date(
        (statusResponse.transaction_time as string) ?? Date.now()
      ),
      fraudStatus,
    };
  }

  /**
   * Maps Midtrans transaction_status to our internal PaymentStatus.
   */
  static mapPaymentStatus(
    transactionStatus: string,
    fraudStatus: string
  ): 'pending' | 'settlement' | 'expire' | 'cancel' | 'deny' | 'failure' {
    if (transactionStatus === 'capture') {
      return fraudStatus === 'challenge' ? 'pending' : 'settlement';
    }
    if (transactionStatus === 'settlement') return 'settlement';
    if (transactionStatus === 'pending') return 'pending';
    if (transactionStatus === 'deny') return 'deny';
    if (transactionStatus === 'expire') return 'expire';
    if (transactionStatus === 'cancel') return 'cancel';
    return 'failure';
  }
}
