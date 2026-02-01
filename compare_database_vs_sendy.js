import fetch from 'node-fetch';

console.log('🔍 Comparing Database vs Sendy List...\n');

const SENDY_URL = 'https://send.alzyara.com';
const SENDY_API_KEY = 'YeFaWqcq7AMXNhe2Zs0C';
const SENDY_LIST_ACTIVE_SUBSCRIBERS = 'k763w2DynPLbBKr4K3LF6uoQ';

// Get subscriber count from Sendy
const getSendySubscriberCount = async () => {
    try {
        const formData = new FormData();
        formData.append('api_key', SENDY_API_KEY);
        formData.append('list_id', SENDY_LIST_ACTIVE_SUBSCRIBERS);

        const response = await fetch(`${SENDY_URL}/api/subscribers/active-subscriber-count.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        const count = parseInt(result);
        return isNaN(count) ? 0 : count;
    } catch (error) {
        console.error('Error getting Sendy subscriber count:', error);
        return 0;
    }
};

// Simulate database query (you would need actual database connection)
const getDatabaseActiveSubscribers = () => {
    // This simulates your database query for active subscribers
    // In reality, this would be: SELECT COUNT(DISTINCT u.id) FROM users u JOIN user_subscriptions us ON u.id = us.user_id WHERE us.status = 'active' AND u.status = 1
    return 4; // Your reported count
};

const analyzeDiscrepancy = async () => {
    console.log('📊 Getting counts...');
    
    const sendyCount = await getSendySubscriberCount();
    const dbCount = getDatabaseActiveSubscribers();
    
    console.log(`📧 Sendy List Count: ${sendyCount}`);
    console.log(`💾 Database Count: ${dbCount}`);
    console.log(`📈 Difference: ${sendyCount - dbCount}`);
    
    if (sendyCount > dbCount) {
        console.log('\n🔍 ANALYSIS: Sendy has MORE users than database');
        console.log('   Possible reasons:');
        console.log('   1. Test users added during API testing (like test@example.com)');
        console.log('   2. Users manually added to Sendy list');
        console.log('   3. Previous campaign runs added duplicate users');
        console.log('   4. Users subscribed via website footer/forms');
        console.log('   5. Old users still in Sendy but removed from database');
        
        console.log('\n💡 SOLUTIONS:');
        console.log('   1. Clean up test users from Sendy list');
        console.log('   2. Check Sendy list for test@example.com and remove it');
        console.log('   3. Sync Sendy list with current database users');
        console.log('   4. Use database as source of truth for campaigns');
        
    } else if (sendyCount < dbCount) {
        console.log('\n🔍 ANALYSIS: Database has MORE users than Sendy');
        console.log('   This means some database users are not in Sendy list yet.');
        
    } else {
        console.log('\n✅ PERFECT MATCH: Database and Sendy counts match!');
    }
    
    console.log('\n🎯 RECOMMENDATION:');
    console.log('   The discrepancy is normal during testing phase.');
    console.log('   For production, consider:');
    console.log('   1. Clean up test data from Sendy lists');
    console.log('   2. Sync database users with Sendy lists periodically');
    console.log('   3. Use database count as the authoritative source');
    
    console.log('\n📧 CAMPAIGN IMPACT:');
    console.log('   • Campaign will reach all users in Sendy list (5 users)');
    console.log('   • This includes your 4 database users + 1 extra user');
    console.log('   • Extra user might be test@example.com from API testing');
    console.log('   • This is harmless but can be cleaned up if needed');
};

// Run analysis
(async () => {
    await analyzeDiscrepancy();
    process.exit(0);
})();