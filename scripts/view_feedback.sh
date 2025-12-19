#!/bin/bash

# View feedback and contact messages

echo "========================================="
echo "📋 FEEDBACK MESSAGES"
echo "========================================="
echo ""

psql "$DATABASE_URL" << EOF
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
echo "📧 CONTACT MESSAGES"
echo "========================================="
echo ""

psql "$DATABASE_URL" << EOF
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
echo "📊 SUMMARY"
echo "========================================="
echo ""

psql "$DATABASE_URL" << EOF
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
