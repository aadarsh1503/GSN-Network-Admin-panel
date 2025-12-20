// Test script to check thank you email functionality
import { sendUserAcceptanceThankYou } from './services/emailService.js';

async function testThankYouEmail() {
    try {
        console.log('Testing thank you email...\n');
        
        // Test email parameters
        const userEmail = 'subodhchauhan1309@gmail.com';
        const userName = 'Aadarsh Chauhan';
        const quoteId = 5;
        const companyName = 'ABC Logistics';
        const companyEmail = 'contact@abclogistics.com';
        const companyPhone = '+971-50-123-4567';
        
        console.log('Sending thank you email with parameters:');
        console.log(`User Email: ${userEmail}`);
        console.log(`User Name: ${userName}`);
        console.log(`Quote ID: ${quoteId}`);
        console.log(`Company Name: ${companyName}`);
        console.log(`Company Email: ${companyEmail}`);
        console.log(`Company Phone: ${companyPhone}`);
        
        await sendUserAcceptanceThankYou(
            userEmail,
            userName,
            quoteId,
            companyName,
            companyEmail,
            companyPhone
        );
        
        console.log('\n✅ Thank you email sent successfully!');
        
    } catch (error) {
        console.error('❌ Error sending thank you email:', error);
    } finally {
        process.exit(0);
    }
}

testThankYouEmail();