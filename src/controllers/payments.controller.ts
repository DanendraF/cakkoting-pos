import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { MidtransService } from '../services/midtrans.service';

/**
 * POST /api/payments/webhook
 * Midtrans notification endpoint.
 * RULE: Order.status ke 'paid' HANYA lewat sini (settlement webhook).
 * RULE: Simpan raw payload untuk audit/debugging.
 *
 * Pastikan endpoint ini tidak memerlukan auth — Midtrans yang call.
 * Security: verifikasi signature via Midtrans SDK.
 */
export async function handleMidtransWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const notification = req.body;

  try {
    // Midtrans SDK verifies the signature key automatically
    const {
      orderId,
      transactionStatus,
      paymentType,
      transactionId,
      transactionTime,
      fraudStatus,
    } = await MidtransService.verifyNotification(notification);

    const paymentStatus = MidtransService.mapPaymentStatus(
      transactionStatus,
      fraudStatus
    );

    console.log(
      `[Webhook] Order: ${orderId} | TxStatus: ${transactionStatus} | FraudStatus: ${fraudStatus} → PaymentStatus: ${paymentStatus}`
    );

    // Update payment record
    await prisma.payment.update({
      where: { midtransOrderId: orderId },
      data: {
        status: paymentStatus,
        paymentType,
        transactionId,
        transactionTime,
        rawNotification: notification,
        updatedAt: new Date(),
      },
    });

    // Update order status based on payment result
    if (paymentStatus === 'settlement') {
      // SUCCESS: order masuk antrean dapur
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid', updatedAt: new Date() },
      });
      console.log(`[Webhook] Order ${orderId} → PAID (ready for kitchen)`);
    } else if (['expire', 'cancel', 'deny', 'failure'].includes(paymentStatus)) {
      // FAILED: order dibatalkan
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', updatedAt: new Date() },
      });
      console.log(`[Webhook] Order ${orderId} → CANCELLED (${paymentStatus})`);
    }
    // 'pending' → status tetap 'pending', tunggu update berikutnya

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    // Always return 200 to Midtrans even on processing error
    // to prevent Midtrans from retrying indefinitely
    res.status(200).json({ message: 'OK' });
  }
}
