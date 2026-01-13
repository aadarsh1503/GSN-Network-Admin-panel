import db from './config/db.js';

const checkEmails = async () => {
  const [users] = await db.execute('SELECT id, name, email FROM users WHERE email IN (?, ?)', ['aadarsh-comapny-3@testing.com', 'aadarshchauhan35@gmail.com']);
  console.log('Users found:');
  users.forEach(user => console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`));
  await db.end();
};

checkEmails();