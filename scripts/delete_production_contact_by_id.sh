#!/bin/bash

# Delete a specific contact message by ID from production

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
