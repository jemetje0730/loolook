#!/bin/bash

# View detailed feedback messages

echo "========================================="
echo "📋 FEEDBACK MESSAGES (DETAILED)"
echo "========================================="
echo ""

psql "$DATABASE_URL" << EOF
SELECT
  id,
  category,
  message,
  location,
  email,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM feedback
ORDER BY created_at DESC;
EOF
