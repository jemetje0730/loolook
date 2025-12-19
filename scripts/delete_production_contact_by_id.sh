#!/bin/bash

# Delete a specific contact message by ID from production

PRODUCTION_DB="postgresql://postgres.lickblvzhcfchhvkqktm:fnfnrdlqslek@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

if [ -z "$1" ]; then
  echo "Usage: ./scripts/delete_production_contact_by_id.sh <id>"
  echo ""
  echo "Example: ./scripts/delete_production_contact_by_id.sh 1"
  exit 1
fi

ID=$1

echo "🗑️  Deleting production contact message #$ID..."
echo ""

RESULT=$(psql "$PRODUCTION_DB" -t -c "DELETE FROM contact_messages WHERE id = $ID RETURNING id;")

if [ -z "$RESULT" ]; then
  echo "❌ Contact message #$ID not found"
else
  echo "✅ Deleted production contact message #$ID"
fi
