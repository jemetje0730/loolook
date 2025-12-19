#!/bin/bash

# View feedback and contact messages from production (Supabase)

PRODUCTION_DB="postgresql://postgres.lickblvzhcfchhvkqktm:fnfnrdlqslek@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

echo "========================================="
echo "📋 FEEDBACK MESSAGES (PRODUCTION)"
echo "========================================="
echo ""

psql "$PRODUCTION_DB" << EOF
SELECT
  id,
  category,
  LEFT(message, 60) || '...' as message_preview,
  LEFT(location, 30) as location,
  email,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created
FROM feedback
ORDER BY created_at DESC
LIMIT 20;
EOF

echo ""
echo "========================================="
echo "📧 CONTACT MESSAGES (PRODUCTION)"
echo "========================================="
echo ""

psql "$PRODUCTION_DB" << EOF
SELECT
  id,
  email,
  LEFT(message, 60) || '...' as message_preview,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created
FROM contact_messages
ORDER BY created_at DESC
LIMIT 20;
EOF

echo ""
echo "========================================="
echo "📊 SUMMARY (PRODUCTION)"
echo "========================================="
echo ""

psql "$PRODUCTION_DB" << EOF
SELECT
  'Feedback' as type,
  category,
  COUNT(*) as count
FROM feedback
GROUP BY category
UNION ALL
SELECT
  'Contact' as type,
  'All' as category,
  COUNT(*) as count
FROM contact_messages
ORDER BY type, category;
EOF

echo ""
