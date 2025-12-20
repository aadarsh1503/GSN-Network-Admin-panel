import bcrypt from 'bcryptjs';

const plainPassword = '123456789';

const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(plainPassword, salt);

console.log('Hashed Password:', hashedPassword);
