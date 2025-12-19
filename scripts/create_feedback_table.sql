-- Create feedback table for storing user feedback and toilet reports
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('toilet_report', 'correction', 'bug', 'suggestion')),
  message TEXT NOT NULL,
  email VARCHAR(255),
  location TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  admin_notes TEXT
);

-- Create index for faster queries by category and status
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Add comment
COMMENT ON TABLE feedback IS 'Stores user feedback, bug reports, and toilet location reports';
