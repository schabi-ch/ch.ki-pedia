ALTER TABLE visitors
  ADD COLUMN quizzes int(11) NOT NULL DEFAULT 0 AFTER simplify_grade_9,
  ADD COLUMN glossaries int(11) NOT NULL DEFAULT 0 AFTER quizzes;