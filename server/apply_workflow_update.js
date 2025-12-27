import db from './config/db.js';
import fs from 'fs';

async function applyWorkflowUpdate() {
    try {
        console.log('🔄 Updating dispute workflow: pending → running → resolved → closed...');
        
        // Read the SQL file
        const sql = fs.readFileSync('./update_dispute_workflow.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
                await db.execute(statement.trim());
            }
        }
        
        console.log('✅ Dispute workflow updated successfully!');
        
        // Verify the changes
        console.log('\n📋 Updated enum values:');
        const [columns] = await db.execute('DESCRIBE disputes');
        const statusField = columns.find(col => col.Field === 'status');
        const companyRequestedField = columns.find(col => col.Field === 'company_requested_status');
        const companySuggestedField = columns.find(col => col.Field === 'company_suggested_status');
        
        console.log(`  status: ${statusField.Type}`);
        console.log(`  company_requested_status: ${companyRequestedField.Type}`);
        console.log(`  company_suggested_status: ${companySuggestedField.Type}`);
        
        // Check current dispute statuses
        console.log('\n📊 Current dispute statuses:');
        const [disputes] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM disputes 
            GROUP BY status
        `);
        disputes.forEach(d => {
            console.log(`  ${d.status}: ${d.count} disputes`);
        });
        
        console.log('\n✅ Workflow: pending → running → resolved → closed');
        
    } catch (error) {
        console.error('❌ Error updating dispute workflow:', error);
    } finally {
        process.exit(0);
    }
}

applyWorkflowUpdate();