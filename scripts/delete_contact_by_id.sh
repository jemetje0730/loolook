#!/bin/bash

# Delete a specific contact message by ID

if [ -z "$1" ]; then
  echo "Usage: ./scripts/delete_contact_by_id.sh <id>"
  echo ""
  echo "Example: ./scripts/delete_contact_by_id.sh 1"
  exit 1
fi

ID=$1

echo "🗑️  Deleting contact message #$ID..."
echo ""

RESULT=$(psql "$DATABASE_URL" -t -c "DELETE FROM contact_messages WHERE id = $ID RETURNING id;")

if [ -z "$RESULT" ]; then
  echo "❌ Contact message #$ID not found"
else
  echo "✅ Deleted contact message #$ID"
fi
