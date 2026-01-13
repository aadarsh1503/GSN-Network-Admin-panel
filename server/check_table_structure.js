import db from './config/db.js';

const checkTable = async () => {
  const [columns] = await db.execute('DESCRIBE quote_responses');
  console.log('quote_responses table structure:');
  columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  await db.end();
};

checkTable();