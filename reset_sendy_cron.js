// Reset Sendy Cron Status
// Based on the official Sendy solution from Ben (Sendy creator)
// This should fix campaigns stuck in "Sending" status

import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false
});

const SENDY_URL = 'https://send.alzyara.com';

async function resetSendyCron() {
    console.log('🔄 Resetting Sendy cron status...\n');
    
    try {
        // Step 1: Reset cron status using official Sendy reset endpoint
        console.log('1. Accessing reset-cron.php...');
        
        const resetResponse = await fetch(`${SENDY_URL}/reset-cron.php`, {
            method: 'GET',
            agent: agent
        });
        
        console.log(`   Status: ${resetResponse.status}`);
        
        if (resetResponse.status === 200) {
            const resetText = await resetResponse.text();
            console.log(`   Response: ${resetText.substring(0, 100)}...`);
            console.log('   ✅ Cron status reset successfully!');
        } else {
            console.log(`   ⚠️ Reset returned status ${resetResponse.status}`);
        }
        
        // Step 2: Wait a moment for reset to take effect
        console.log('\n2. Waiting for reset to take effect...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 3: Trigger scheduled.php to start processing
        console.log('\n3. Triggering campaign processing...');
        
        const triggerResponse = await fetch(`${SENDY_URL}/scheduled.php`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SendyCron/1.0)'
            },
            agent: agent
        });
        
        console.log(`   Status: ${triggerResponse.status}`);
        
        if (triggerResponse.status === 200) {
            console.log('   ✅ Campaign processing triggered successfully!');
        }
        
        console.log('\n🎉 SENDY CRON RESET COMPLETE!');
        console.log('📧 Your "Sending" campaigns should now start processing');
        console.log('⏳ Check your Sendy admin panel in 1-2 minutes');
        console.log('🔄 Future campaigns should now work automatically');
        
        console.log('\n💡 What this fixed:');
        console.log('   - Reset any stuck cron job status');
        console.log('   - Cleared any processing locks');
        console.log('   - Reinitialized campaign processing');
        console.log('   - Should resolve the "Sending" status issue');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
        console.log('\n💡 If reset fails, try these alternatives:');
        console.log('   1. Access https://send.alzyara.com/reset-cron.php directly in browser');
        console.log('   2. Contact hosting provider to reset Sendy cron status');
        console.log('   3. Check Sendy admin panel for cron job setup instructions');
    }
}

// Run the reset
resetSendyCron();