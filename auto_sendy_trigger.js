// Automated Sendy Campaign Trigger
// This runs every 2 minutes to process pending campaigns
// Use this as a temporary solution until proper cron job is set up

import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false
});

const SENDY_URL = 'https://send.alzyara.com';

async function triggerSendyProcessing() {
    try {
        const response = await fetch(`${SENDY_URL}/scheduled.php`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SendyCron/1.0)'
            },
            agent: agent
        });
        
        const timestamp = new Date().toLocaleString();
        
        if (response.status === 200) {
            console.log(`✅ [${timestamp}] Sendy trigger successful (Status: ${response.status})`);
        } else {
            console.log(`⚠️ [${timestamp}] Sendy trigger warning (Status: ${response.status})`);
        }
        
    } catch (error) {
        const timestamp = new Date().toLocaleString();
        console.log(`❌ [${timestamp}] Sendy trigger failed: ${error.message}`);
    }
}

console.log('🚀 Starting automated Sendy campaign processor...');
console.log('⏰ Will trigger Sendy processing every 2 minutes');
console.log('🛑 Press Ctrl+C to stop');
console.log('📧 This ensures your campaigns process automatically\n');

// Run immediately
triggerSendyProcessing();

// Then run every 2 minutes
setInterval(triggerSendyProcessing, 2 * 60 * 1000);

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping automated Sendy trigger...');
    console.log('💡 Remember to contact hosting provider for permanent cron job setup');
    process.exit(0);
});