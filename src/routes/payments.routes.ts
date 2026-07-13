import { Router } from 'express';
import { handleMidtransWebhook } from '../controllers/payments.controller';

const router = Router();

// POST /api/payments/webhook — Midtrans notification (no auth, Midtrans calls this)
// Security: handled via signature verification inside the controller (Midtrans SDK)
router.post('/webhook', handleMidtransWebhook);

export default router;
