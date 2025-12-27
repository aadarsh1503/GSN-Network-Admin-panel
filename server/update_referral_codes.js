import db from './config/db.js';

const updateReferralCodes = async () => {
    try {
        console.log('Updating referral codes for existing users...');
        
        // Get all users without referral codes
        const [users] = await db.execute('SELECT id FROM users WHERE referral_code IS NULL OR referral_code = ""');
        
        console.log(`Found ${users.length} users without referral codes`);
        
        for (const user of users) {
            const referralCode = `GSN${user.id}${String(user.id).padStart(4, '0')}`;
            await db.execute('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, user.id]);
            console.log(`Updated user ${user.id} with referral code: ${referralCode}`);
        }
        
        console.log('Referral codes updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating referral codes:', error);
        process.exit(1);
    }
};

updateReferralCodes();