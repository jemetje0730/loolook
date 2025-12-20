#!/bin/bash

# View detailed contact messages

echo "========================================="
echo "📧 CONTACT MESSAGES (DETAILED)"
echo "========================================="
echo ""

psql "$DATABASE_URL" << EOF
SELECT
  id,
  email,
  message,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM contact_messages
ORDER BY created_at DESC;
EOF
