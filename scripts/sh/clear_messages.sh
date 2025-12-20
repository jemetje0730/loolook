#!/bin/bash

# Clear all feedback and contact messages

echo "⚠️  WARNING: This will delete ALL feedback and contact messages!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled."
  exit 0
fi

echo ""
echo "🗑️  Deleting all messages..."
echo ""

# Delete feedback
FEEDBACK_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM feedback;")
psql "$DATABASE_URL" -c "DELETE FROM feedback;"
echo "✅ Deleted $FEEDBACK_COUNT feedback messages"

# Delete contact messages
CONTACT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM contact_messages;")
psql "$DATABASE_URL" -c "DELETE FROM contact_messages;"
echo "✅ Deleted $CONTACT_COUNT contact messages"

echo ""
echo "✨ All messages cleared!"
