#!/bin/bash

# Delete a specific feedback message by ID

if [ -z "$1" ]; then
  echo "Usage: ./scripts/delete_feedback_by_id.sh <id>"
  echo ""
  echo "Example: ./scripts/delete_feedback_by_id.sh 1"
  exit 1
fi

ID=$1

echo "🗑️  Deleting feedback #$ID..."
echo ""

RESULT=$(psql "$DATABASE_URL" -t -c "DELETE FROM feedback WHERE id = $ID RETURNING id;")

if [ -z "$RESULT" ]; then
  echo "❌ Feedback #$ID not found"
else
  echo "✅ Deleted feedback #$ID"
fi
