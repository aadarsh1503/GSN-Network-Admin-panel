-- Add ticket_id field to messages table for ticket-message integration
-- This allows messages to reference support tickets for better traceability

-- Add the ticket_id column
ALTER TABLE messages 
ADD COLUMN ticket_id INT(11) DEFAULT NULL AFTER quote_id;

-- Add foreign key constraint
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_ticket_id 
FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);

-- Update existing messages that might be ticket-related based on subject
-- This is optional and can be run to link existing ticket-related messages
UPDATE messages 
SET ticket_id = (
    SELECT st.id 
    FROM support_tickets st 
    WHERE messages.subject LIKE CONCAT('%', st.ticket_number, '%')
    LIMIT 1
)
WHERE subject IS NOT NULL 
AND (subject LIKE '%Ticket%' OR subject LIKE '%GSN-%')
AND ticket_id IS NULL;

-- Verify the changes
SELECT 
    COUNT(*) as total_messages,
    COUNT(ticket_id) as ticket_linked_messages,
    COUNT(quote_id) as quote_linked_messages
FROM messages;

-- Show sample ticket-linked messages
SELECT 
    m.id,
    m.subject,
    m.ticket_id,
    st.ticket_number,
    st.subject as ticket_subject
FROM messages m
LEFT JOIN support_tickets st ON m.ticket_id = st.id
WHERE m.ticket_id IS NOT NULL
LIMIT 5;