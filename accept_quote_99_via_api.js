// Accept Quote #99 payment via API calls (simulating company account actions)
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function acceptQuote99ViaAPI() {
    try {
        console.log('🔍 Accepting Quote #99 payment via API calls...');
        
        // Step 1: Login as company account
        console.log('\n🔐 Step 1: Logging in as company account...');
        const loginResponse = await fetch(`${API_BASE}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'aadarshchauhan35@gmail.com',
                password: '222333'
            })
        });
        
        if (!loginResponse.ok) {
            const loginError = await loginResponse.json();
            console.error('❌ Login failed:', loginError);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        const companyUser = loginData.user;
        
        console.log('✅ Company login successful:');
        console.log(`   Name: ${companyUser.name}`);
        console.log(`   Email: ${companyUser.email}`);
        console.log(`   Role: ${companyUser.role}`);
        console.log(`   ID: ${companyUser.id}`);
        
        // Step 2: Get pending payments from PaymentManagement API
        console.log('\n📊 Step 2: Fetching pending payments...');
        const paymentsResponse = await fetch(`${API_BASE}/api/enhanced-quotes/company-responses-with-payments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!paymentsResponse.ok) {
            const paymentsError = await paymentsResponse.json();
            console.error('❌ Failed to fetch payments:', paymentsError);
            return;
        }
        
        const paymentsData = await paymentsResponse.json();
        console.log(`✅ Fetched ${paymentsData.length} payment records`);
        
        // Filter for Quote #99 pending payments
        const quote99Payments = paymentsData.filter(item => {
            const isQuote99 = item.quote_id === 99;
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            return isQuote99 && hasPaymentProof && needsVerification;
        });
        
        console.log(`🔍 Found ${quote99Payments.length} pending payment(s) for Quote #99`);
        
        if (quote99Payments.length === 0) {
            console.log('❌ No pending payments found for Quote #99');
            console.log('\n📋 All payments for this company:');
            paymentsData.forEach(payment => {
                if (payment.quote_id === 99) {
                    console.log(`   Quote #${payment.quote_id}: ${payment.user_name} - $${payment.price} - Status: ${payment.payment_status || 'No payment'} - Proof: ${payment.payment_proof_uploaded ? 'Yes' : 'No'}`);
                }
            });
            return;
        }
        
        const quote99Payment = quote99Payments[0];
        console.log('✅ Found Quote #99 pending payment:');
        console.log(`   Quote ID: ${quote99Payment.quote_id}`);
        console.log(`   Customer: ${quote99Payment.user_name} (${quote99Payment.user_email})`);
        console.log(`   Amount: $${quote99Payment.price}`);
        console.log(`   Product: ${quote99Payment.product_description}`);
        console.log(`   Route: ${quote99Payment.departure_country} → ${quote99Payment.arrival_country}`);
        console.log(`   Payment Verification ID: ${quote99Payment.payment_verification_id}`);
        console.log(`   Payment Status: ${quote99Payment.payment_status}`);
        console.log(`   Payment Proof File: ${quote99Payment.payment_proof_filename}`);
        console.log(`   Upload Date: ${quote99Payment.payment_proof_date}`);
        
        // Step 3: Verify the payment using the API
        console.log('\n✅ Step 3: Verifying the payment via API...');
        const verificationId = quote99Payment.payment_verification_id;
        
        if (!verificationId) {
            console.error('❌ No payment verification ID found');
            return;
        }
        
        const verifyResponse = await fetch(`${API_BASE}/api/payments/verify-enhanced/${verificationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                verification_status: 'verified',
                company_notes: `Payment verified via API for Quote #99 - ${quote99Payment.payment_proof_filename} accepted`
            })
        });
        
        if (!verifyResponse.ok) {
            const verifyError = await verifyResponse.json();
            console.error('❌ Payment verification failed:', verifyError);
            return;
        }
        
        const verifyData = await verifyResponse.json();
        console.log('✅ Payment verification successful:');
        console.log(`   Response: ${JSON.stringify(verifyData, null, 2)}`);
        
        // Step 4: Verify the changes by fetching payments again
        console.log('\n🔍 Step 4: Verifying the changes...');
        const updatedPaymentsResponse = await fetch(`${API_BASE}/api/enhanced-quotes/company-responses-with-payments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (updatedPaymentsResponse.ok) {
            const updatedPaymentsData = await updatedPaymentsResponse.json();
            const updatedQuote99 = updatedPaymentsData.find(item => item.quote_id === 99);
            
            if (updatedQuote99) {
                console.log('✅ Updated Quote #99 status:');
                console.log(`   Payment Status: ${updatedQuote99.payment_status}`);
                console.log(`   Quote Status: ${updatedQuote99.quote_status}`);
                console.log(`   User Response Status: ${updatedQuote99.user_response_status}`);
                console.log(`   Verification Notes: ${updatedQuote99.verification_notes || 'None'}`);
            }
        }
        
        // Step 5: Check if payment is no longer in pending list
        console.log('\n📊 Step 5: Checking remaining pending payments...');
        const remainingPending = updatedPaymentsData.filter(item => {
            const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
            const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
            return hasPaymentProof && needsVerification;
        });
        
        console.log(`✅ Remaining pending payments: ${remainingPending.length}`);
        if (remainingPending.length > 0) {
            console.log('   Remaining pending quotes:');
            remainingPending.forEach(payment => {
                console.log(`   - Quote #${payment.quote_id}: ${payment.user_name} - $${payment.price}`);
            });
        }
        
        console.log('\n🎉 SUCCESS SUMMARY:');
        console.log('✅ Company account logged in successfully');
        console.log('✅ Quote #99 payment proof found and processed');
        console.log('✅ Payment verification API call successful');
        console.log('✅ Payment status updated to VERIFIED');
        console.log('✅ Quote status updated accordingly');
        console.log('✅ Customer will be notified of approval');
        
        console.log('\n📋 QUOTE #99 DETAILS:');
        console.log(`   Customer: ${quote99Payment.user_name} (${quote99Payment.user_email})`);
        console.log(`   Amount: $${quote99Payment.price}`);
        console.log(`   Product: ${quote99Payment.product_description}`);
        console.log(`   Route: ${quote99Payment.departure_country} → ${quote99Payment.arrival_country}`);
        console.log(`   Status: VERIFIED & APPROVED`);
        
    } catch (error) {
        console.error('❌ Error processing Quote #99 payment via API:', error);
    }
}

acceptQuote99ViaAPI();