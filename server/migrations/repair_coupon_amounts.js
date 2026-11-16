// migrations/repair_coupon_amounts.js
// One-off data repair:
//  1. Back-fill subscription_requests.amount_paid (PayPal requests left it NULL)
//  2. Copy the coupon-discounted amount + coupon info into user_subscriptions
//  3. Align invoices with the discounted subscription amount
import db from '../config/db.js';

const report = async (label, sql) => {
  const [rows] = await db.execute(sql);
  console.log(`\n--- ${label} ---`);
  console.table(rows);
  return rows;
};

async function run() {
  await report('BEFORE: subscriptions', `
    SELECT id, user_id, amount_paid, coupon_code, final_amount_bhd, transaction_id
    FROM user_subscriptions WHERE coupon_code IS NOT NULL OR id IN (
      SELECT us.id FROM user_subscriptions us
      JOIN subscription_requests sr ON sr.transaction_id <=> us.transaction_id AND sr.user_id = us.user_id
      WHERE sr.coupon_code IS NOT NULL
    )`);

  // 1) Back-fill request.amount_paid
  const [r1] = await db.execute(
    `UPDATE subscription_requests SET amount_paid = COALESCE(final_amount_bhd, plan_price)
     WHERE amount_paid IS NULL`
  );
  console.log(`\n1) subscription_requests.amount_paid back-filled: ${r1.affectedRows} row(s)`);

  // 2) Copy coupon info + discounted amount into the approved subscriptions
  const [r2] = await db.execute(`
    UPDATE user_subscriptions us
    JOIN subscription_requests sr
      ON sr.transaction_id <=> us.transaction_id
     AND sr.user_id = us.user_id
     AND sr.status = 'approved'
    SET us.amount_paid          = COALESCE(sr.amount_paid, sr.final_amount_bhd, us.amount_paid),
        us.coupon_code          = COALESCE(us.coupon_code, sr.coupon_code),
        us.coupon_discount_bhd  = COALESCE(us.coupon_discount_bhd, sr.coupon_discount_bhd),
        us.final_amount_bhd     = COALESCE(us.final_amount_bhd, sr.final_amount_bhd)
    WHERE sr.coupon_code IS NOT NULL
  `);
  console.log(`2) user_subscriptions updated with coupon amounts: ${r2.affectedRows} row(s)`);

  // 3) Align invoices with the discounted subscription amount
  const [r3] = await db.execute(`
    UPDATE invoices i
    JOIN user_subscriptions us ON i.subscription_id = us.id
    SET i.amount = us.final_amount_bhd, i.total_amount = us.final_amount_bhd
    WHERE us.coupon_code IS NOT NULL AND us.final_amount_bhd IS NOT NULL
      AND (i.amount <> us.final_amount_bhd OR i.total_amount <> us.final_amount_bhd)
  `);
  console.log(`3) invoices aligned with discounted amount: ${r3.affectedRows} row(s)`);

  await report('AFTER: subscriptions', `
    SELECT id, user_id, amount_paid, coupon_code, coupon_discount_bhd, final_amount_bhd, transaction_id
    FROM user_subscriptions WHERE coupon_code IS NOT NULL ORDER BY id DESC`);

  await report('AFTER: invoices', `
    SELECT i.id, i.subscription_id, i.amount, i.total_amount, us.coupon_code, us.final_amount_bhd
    FROM invoices i JOIN user_subscriptions us ON i.subscription_id = us.id
    WHERE us.coupon_code IS NOT NULL ORDER BY i.id DESC`);

  console.log('\nDone.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
