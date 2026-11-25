// routes/paypalWebhookRoutes.js
//
// PayPal webhook receiver — a safety net that reconciles payments the API flow
// could not finalise synchronously (e.g. the browser closed before the capture
// call came back). Payloads must be read as a RAW body so the signature can be
// verified, therefore this router is mounted BEFORE express.json() in index.js.

import express from 'express';
import db from '../config/db.js';
import paypalService from '../services/paypalService.js';
import { finalizeSubscriptionRequest } from '../controllers/subscriptionController.js';

const router = express.Router();

/** Order id referenced by the event, if any. */
const orderIdFromEvent = (event) => {
  const resource = event?.resource || {};
  return (
    resource?.supplementary_data?.related_ids?.order_id ||
    (event?.resource_type === 'checkout-order' ? resource.id : null) ||
    null
  );
};

// @desc    PayPal webhook listener
// @route   POST /api/webhooks/paypal
// @access  Public (signature verified)
router.post('/paypal', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  let event;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // Always acknowledge quickly — PayPal retries on non-2xx, so verification
  // problems are logged instead of looping.
  try {
    await paypalService.ensureConfig();
    if (!paypalService.isConfigured()) {
      console.warn('⚠️ PayPal webhook received but PayPal is not configured — ignored');
      return res.json({ received: true, ignored: true });
    }

    const verified = await paypalService.verifyWebhookSignature(req.headers, event);
    if (!verified) {
      console.warn('⚠️ PayPal webhook signature verification failed');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const eventType = event?.event_type;
    const orderId = orderIdFromEvent(event);
    console.log(`🔔 PayPal webhook: ${eventType}${orderId ? ` (order ${orderId})` : ''}`);

    if (orderId && ['PAYMENT.CAPTURE.COMPLETED', 'CHECKOUT.ORDER.APPROVED'].includes(eventType)) {
      const [rows] = await db.execute(
        `SELECT id FROM subscription_requests WHERE paypal_order_id = ? AND status = 'pending' LIMIT 1`,
        [orderId]
      );

      if (rows.length) {
        await finalizeSubscriptionRequest(rows[0].id, { actorId: null, actorIsAdmin: false });
        console.log(`✅ Subscription request #${rows[0].id} activated from PayPal webhook`);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return res.json({ received: true });
  }
});

export default router;
