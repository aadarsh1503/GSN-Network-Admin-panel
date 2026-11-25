// services/subscriptionLimitService.js
// Centralised subscription limit checks. Every endpoint that creates
// billable activity (quote requests / quote responses) uses these so the
// same plan limits are respected everywhere instead of only on one route.
import db from '../config/db.js';

/**
 * Fetch a user's currently active subscription joined with its plan.
 * Returns null when the user has no active, non-expired subscription.
 */
export const getActiveSubscription = async (userId) => {
    const sql = `
        SELECT us.*, mp.name AS plan_name, mp.max_quotes, mp.max_responses
        FROM user_subscriptions us
        JOIN membership_plans mp ON us.plan_id = mp.id
        WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
        ORDER BY us.end_date DESC
        LIMIT 1
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
};

// Count rows created in the current calendar month for the given column.
//
// `since` (optional) is the start date of the user's current subscription. The
// quota belongs to the plan the buyer is on right now, so usage from an older
// plan must not count against the new one — changing plan therefore starts a
// fresh count for the rest of the month.
export const countThisMonth = async (table, column, userId, since = null) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const sinceClause = since ? ' AND created_at >= ?' : '';
    const sql = `
        SELECT COUNT(*) AS c
        FROM ${table}
        WHERE ${column} = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?${sinceClause}
    `;
    const params = since ? [userId, currentMonth, since] : [userId, currentMonth];
    const [rows] = await db.execute(sql, params);
    return rows[0].c;
};

export const countMonthlyResponses = (userId, since = null) =>
    countThisMonth('quote_responses', 'company_id', userId, since);
export const countMonthlyQuotes = (userId, since = null) =>
    countThisMonth('quotes', 'user_id', userId, since);

/**
 * Response-limit check for the "company responds to a quote" flow.
 * max_responses: -1 = unlimited, 0 = not allowed, N = monthly cap.
 */
export const checkResponseAllowed = async (userId) => {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) {
        return {
            allowed: false,
            requiresSubscription: true,
            message: 'Active subscription required to respond to quotes',
        };
    }
    const maxResponses = Number(subscription.max_responses);
    // Only count responses made under the plan that is active now.
    const currentResponses = await countMonthlyResponses(userId, subscription.start_date);
    if (maxResponses !== -1 && currentResponses >= maxResponses) {
        return {
            allowed: false,
            subscription,
            currentResponses,
            maxResponses,
            message: `Monthly response limit reached (${maxResponses})`,
        };
    }
    return { allowed: true, subscription, currentResponses, maxResponses };
};

/**
 * Quote-request limit check for logged-in users posting a quote.
 * Only enforced when the user has an active subscription, so guest/public
 * quote posting keeps working. max_quotes: -1 = unlimited, N = monthly cap.
 */
export const checkQuoteRequestAllowed = async (userId) => {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) return { allowed: true, subscription: null };

    const maxQuotes = Number(subscription.max_quotes);
    if (maxQuotes === -1) return { allowed: true, subscription };

    const currentQuotes = await countMonthlyQuotes(userId);
    if (currentQuotes >= maxQuotes) {
        return {
            allowed: false,
            subscription,
            currentQuotes,
            maxQuotes,
            message: `Monthly quote request limit reached (${maxQuotes}). Please upgrade your plan.`,
        };
    }
    return { allowed: true, subscription, currentQuotes, maxQuotes };
};
