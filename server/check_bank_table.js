import db from './config/db.js';

const checkTable = async () => {
  const [columns] = await db.execute('DESCRIBE company_bank_details');
  console.log('company_bank_details table structure:');
  columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  await db.end();
};

checkTable();