#!/bin/bash

# Clear all feedback and contact messages from production (Supabase)

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo "❌ .env.local not found"
  exit 1
fi

if [ -z "$PRODUCTION_DB" ]; then
  echo "❌ PRODUCTION_DB is not set"
  exit 1
fi

echo "⚠️  WARNING: This will delete ALL production feedback and contact messages!"
echo "   (This affects loolook.vercel.app)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled."
  exit 0
fi

echo ""
echo "🗑️  Deleting all production messages..."
echo ""

# Delete feedback
FEEDBACK_COUNT=$(psql "$PRODUCTION_DB" -t -c "SELECT COUNT(*) FROM feedback;")
psql "$PRODUCTION_DB" -c "DELETE FROM feedback;"
echo "✅ Deleted $FEEDBACK_COUNT feedback messages"

# Delete contact messages
CONTACT_COUNT=$(psql "$PRODUCTION_DB" -t -c "SELECT COUNT(*) FROM contact_messages;")
psql "$PRODUCTION_DB" -c "DELETE FROM contact_messages;"
echo "✅ Deleted $CONTACT_COUNT contact messages"

echo ""
echo "✨ All production messages cleared!"
