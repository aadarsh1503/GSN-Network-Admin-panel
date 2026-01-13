// Script to add comprehensive backend logging for quote visibility debugging
// This will help track which quotes are verified/approved and why they appear or don't appear

import fs from 'fs';
import path from 'path';

const CONTROLLER_FILES = [
    'server/controllers/quoteController.js',
    'server/controllers/enhancedQuoteController.js',
    'server/controllers/userQuoteController.js'
];

// Enhanced logging for getAvailableQuotes function
const enhanceGetAvailableQuotes = (content) => {
    // Add logging at the beginning of the function
    const functionStart = content.indexOf('const getAvailableQuotes = async (req, res) => {');
    if (functionStart === -1) return content;
    
    const insertPoint = content.indexOf('const userId = req.user.id;', functionStart);
    if (insertPoint === -1) return content;
    
    const logStatement = `
    console.log(\`🔍 [QUOTES-DEBUG] \${new Date().toISOString()} - getAvailableQuotes called for company \${userId}\`);
    console.log(\`📊 [QUOTES-DEBUG] Request details:\`, {
        userId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });`;
    
    let enhanced = content.slice(0, insertPoint + 'const userId = req.user.id;'.length) + 
                   logStatement + 
                   content.slice(insertPoint + 'const userId = req.user.id;'.length);
    
    // Add logging before the main query
    const queryStart = enhanced.indexOf('const quotesSql = `');
    if (queryStart !== -1) {
        const queryLogStatement = `
        console.log(\`🔍 [QUOTES-DEBUG] Company location:\`, companyLocation);
        console.log(\`🔍 [QUOTES-DEBUG] Location filter:\`, locationFilter);
        console.log(\`🔍 [QUOTES-DEBUG] Location params:\`, locationParams);
        console.log(\`🔍 [QUOTES-DEBUG] Executing quotes query with params:\`, finalParams);
        `;
        
        enhanced = enhanced.slice(0, queryStart) + queryLogStatement + enhanced.slice(queryStart);
    }
    
    // Add logging after the query execution
    const queryExecution = enhanced.indexOf('const [quotes] = await db.execute(quotesSql, finalParams);');
    if (queryExecution !== -1) {
        const postQueryLogStatement = `
        console.log(\`📊 [QUOTES-DEBUG] Raw query returned \${quotes.length} quotes\`);
        console.log(\`📋 [QUOTES-DEBUG] Quote IDs found:\`, quotes.map(q => q.id));
        
        // Debug: Check filtering logic for first few quotes
        if (quotes.length > 0) {
            console.log(\`🔍 [QUOTES-DEBUG] Analyzing first 3 quotes for filtering logic:\`);
            for (const quote of quotes.slice(0, 3)) {
                console.log(\`  Quote \${quote.id}:\`);
                console.log(\`    - Status: \${quote.status}\`);
                console.log(\`    - User ID: \${quote.user_id}\`);
                console.log(\`    - Route: \${quote.departure_country} → \${quote.arrival_country}\`);
                
                // Check if quote has accepted responses
                const [acceptedCheck] = await db.execute(
                    'SELECT COUNT(*) as count FROM user_quote_status WHERE quote_id = ? AND status = "accepted"',
                    [quote.id]
                );
                console.log(\`    - Accepted responses: \${acceptedCheck[0].count}\`);
                
                // Check if quote has payment proofs
                const [paymentCheck] = await db.execute(
                    \`SELECT COUNT(*) as count FROM user_quote_status uqs 
                     JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id 
                     WHERE uqs.quote_id = ?\`,
                    [quote.id]
                );
                console.log(\`    - Payment proofs: \${paymentCheck[0].count}\`);
                
                // Check if quote has verified payments
                const [verifiedCheck] = await db.execute(
                    \`SELECT COUNT(*) as count FROM user_quote_status uqs
                     JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
                     JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                     WHERE uqs.quote_id = ? AND pv.verification_status = 'verified'\`,
                    [quote.id]
                );
                console.log(\`    - Verified payments: \${verifiedCheck[0].count}\`);
                
                // Check if company already responded
                const [responseCheck] = await db.execute(
                    'SELECT COUNT(*) as count FROM quote_responses WHERE quote_id = ? AND company_id = ?',
                    [quote.id, userId]
                );
                console.log(\`    - Company responses: \${responseCheck[0].count}\`);
            }
        }
        `;
        
        enhanced = enhanced.slice(0, queryExecution + 'const [quotes] = await db.execute(quotesSql, finalParams);'.length) + 
                   postQueryLogStatement + 
                   enhanced.slice(queryExecution + 'const [quotes] = await db.execute(quotesSql, finalParams);'.length);
    }
    
    return enhanced;
};

// Enhanced logging for getCompanyResponsesWithPayments function
const enhanceGetCompanyResponsesWithPayments = (content) => {
    const functionStart = content.indexOf('const getCompanyResponsesWithPayments = async (req, res) => {');
    if (functionStart === -1) return content;
    
    const insertPoint = content.indexOf('const companyId = req.user.id;', functionStart);
    if (insertPoint === -1) return content;
    
    const logStatement = `
    console.log(\`🔍 [MY-QUOTES-DEBUG] \${new Date().toISOString()} - getCompanyResponsesWithPayments called for company \${companyId}\`);`;
    
    let enhanced = content.slice(0, insertPoint + 'const companyId = req.user.id;'.length) + 
                   logStatement + 
                   content.slice(insertPoint + 'const companyId = req.user.id;'.length);
    
    // Add logging after query execution
    const queryExecution = enhanced.indexOf('const [responses] = await db.execute(`');
    if (queryExecution !== -1) {
        const nextSemicolon = enhanced.indexOf(';', queryExecution);
        if (nextSemicolon !== -1) {
            const postQueryLogStatement = `
        
        console.log(\`📊 [MY-QUOTES-DEBUG] Found \${responses.length} company responses with payments\`);
        console.log(\`📋 [MY-QUOTES-DEBUG] Response details:\`);
        responses.slice(0, 5).forEach((response, index) => {
            console.log(\`  \${index + 1}. Quote \${response.id} (Response \${response.response_id}):\`);
            console.log(\`    - Customer: \${response.user_name} (\${response.user_email})\`);
            console.log(\`    - Price: $\${response.price}\`);
            console.log(\`    - User Response Status: \${response.user_response_status}\`);
            console.log(\`    - Payment Status: \${response.payment_status}\`);
            console.log(\`    - Accepted At: \${response.accepted_at}\`);
            console.log(\`    - Payment Proof: \${response.payment_proof_uploaded ? 'Yes' : 'No'}\`);
            console.log(\`    - Verification Date: \${response.verification_date}\`);
        });
        if (responses.length > 5) {
            console.log(\`  ... and \${responses.length - 5} more responses\`);
        }`;
            
            enhanced = enhanced.slice(0, nextSemicolon + 1) + postQueryLogStatement + enhanced.slice(nextSemicolon + 1);
        }
    }
    
    return enhanced;
};

// Function to backup and enhance a file
const enhanceFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }
        
        // Create backup
        const backupPath = filePath + '.backup.' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        console.log(`📁 Created backup: ${backupPath}`);
        
        // Read original content
        let content = fs.readFileSync(filePath, 'utf8');
        let enhanced = content;
        
        // Apply enhancements based on file
        if (filePath.includes('quoteController.js')) {
            enhanced = enhanceGetAvailableQuotes(enhanced);
        } else if (filePath.includes('enhancedQuoteController.js')) {
            enhanced = enhanceGetCompanyResponsesWithPayments(enhanced);
        }
        
        // Write enhanced content
        if (enhanced !== content) {
            fs.writeFileSync(filePath, enhanced);
            console.log(`✅ Enhanced: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error enhancing ${filePath}:`, error.message);
        return false;
    }
};

// Main function
const addBackendLogging = () => {
    console.log('🚀 Adding Backend Logging for Quote Visibility Debugging');
    console.log('=' .repeat(60));
    
    let enhancedCount = 0;
    
    CONTROLLER_FILES.forEach(filePath => {
        console.log(`\n🔧 Processing: ${filePath}`);
        if (enhanceFile(filePath)) {
            enhancedCount++;
        }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${CONTROLLER_FILES.length}`);
    console.log(`   Files enhanced: ${enhancedCount}`);
    
    if (enhancedCount > 0) {
        console.log(`\n✅ Backend logging enhanced successfully!`);
        console.log(`\n🔧 Next steps:`);
        console.log(`   1. Restart your server to apply changes`);
        console.log(`   2. Test the accounts mentioned in the issue`);
        console.log(`   3. Check server logs for detailed debugging info`);
        console.log(`   4. Run the verification script: node test_quotes_visibility_verification.js`);
    } else {
        console.log(`\nℹ️  No files were enhanced. They may already have logging or the functions weren't found.`);
    }
    
    console.log('\n🏁 Logging enhancement completed');
    console.log('=' .repeat(60));
};

// Run the enhancement
addBackendLogging();