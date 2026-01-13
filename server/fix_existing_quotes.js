import db from './config/db.js';

const fixExistingQuotes = async () => {
  console.log('🔧 Fixing existing problematic quotes...');
  
  // Find quotes that are stuck in payment_pending status but shouldn't be
  const [stuckQuotes] = await db.execute(`
    SELECT q.id, q.status, COUNT(uqs.id) as accepted_count
    FROM quotes q
    LEFT JOIN user_quote_status uqs ON q.id = uqs.quote_id AND uqs.status = 'accepted'
    WHERE q.status = 'payment_pending'
    GROUP BY q.id
    HAVING accepted_count = 0
  `);
  
  console.log(`Found ${stuckQuotes.length} quotes stuck in payment_pending without user acceptance`);
  
  for (const quote of stuckQuotes) {
    console.log(`Fixing Quote ID: ${quote.id}`);
    await db.execute('UPDATE quotes SET status = ? WHERE id = ?', ['pending', quote.id]);
  }
  
  console.log('✅ Fixed existing quotes');
  await db.end();
};

fixExistingQuotes();