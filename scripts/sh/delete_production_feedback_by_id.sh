#!/bin/bash

# Delete a specific feedback message by ID from production

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
  echo "Usage: ./scripts/delete_production_feedback_by_id.sh <id>"
  echo ""
  echo "Example: ./scripts/delete_production_feedback_by_id.sh 1"
  exit 1
fi

ID=$1

echo "🗑️  Deleting production feedback #$ID..."
echo ""

RESULT=$(psql "$PRODUCTION_DB" -t -c "DELETE FROM feedback WHERE id = $ID RETURNING id;")

if [ -z "$RESULT" ]; then
  echo "❌ Feedback #$ID not found"
else
  echo "✅ Deleted production feedback #$ID"
fi
