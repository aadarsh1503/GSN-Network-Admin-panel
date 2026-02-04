// Manual Sendy Campaign Trigger
// This script can manually trigger Sendy's scheduled.php to process pending campaigns
// Use this as a temporary workaround while waiting for proper cron job setup

import fetch from 'node-fetch';
import https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false
});

const SENDY_URL = 'https://send.alzyara.com';

async function manualTriggerSendyCampaigns() {
    console.log('🚀 Manually triggering Sendy campaign processing...\n');
    
    try {
        console.log('Attempting to trigger scheduled.php...');
        
        // Try multiple approaches to trigger the cron job
        const approaches = [
            {
                name: 'Direct scheduled.php call',
                url: `${SENDY_URL}/scheduled.php`,
                method: 'GET'
            },
            {
                name: 'Scheduled.php with user agent',
                url: `${SENDY_URL}/scheduled.php`,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SendyCron/1.0)'
                }
            },
            {
                name: 'Scheduled.php with cron parameter',
                url: `${SENDY_URL}/scheduled.php?cron=1`,
                method: 'GET'
            }
        ];
        
        for (let i = 0; i < approaches.length; i++) {
            const approach = approaches[i];
            console.log(`\n${i + 1}. Trying: ${approach.name}`);
            
            try {
                const response = await fetch(approach.url, {
                    method: approach.method,
                    headers: approach.headers || {},
                    agent: agent
                });
                
                console.log(`   Status: ${response.status}`);
                
                if (response.status === 200) {
                    const text = await response.text();
                    console.log(`   Response length: ${text.length} characters`);
                    
                    if (text.includes('success') || text.includes('processed') || text.length > 0) {
                        console.log('   ✅ Trigger appears successful!');
                    } else {
                        console.log('   ⚠️ Trigger sent but response unclear');
                    }
                } else {
                    console.log(`   ❌ HTTP ${response.status} error`);
                }
                
                // Wait between attempts
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
            }
        }
        
        console.log('\n📋 Manual trigger attempts completed.');
        console.log('💡 Check your Sendy admin panel to see if campaigns started processing.');
        console.log('⏳ If successful, "Sending" campaigns should start delivering emails within 1-2 minutes.');
        
        console.log('\n🔄 You can run this script periodically as a workaround:');
        console.log('   - Every 5 minutes to process pending campaigns');
        console.log('   - After creating new campaigns from your app');
        console.log('   - Until proper cron job is set up by hosting provider');
        
    } catch (error) {
        console.error('❌ Manual trigger failed:', error.message);
        console.log('\n💡 This means you definitely need the hosting provider to set up the cron job.');
    }
}

// Run the manual trigger
manualTriggerSendyCampaigns();

// Optional: Set up interval to run every 5 minutes
// Uncomment the lines below to run automatically every 5 minutes
/*
console.log('\n🔄 Setting up automatic trigger every 5 minutes...');
setInterval(() => {
    console.log('\n⏰ Running scheduled trigger...');
    manualTriggerSendyCampaigns();
}, 5 * 60 * 1000); // 5 minutes
*/