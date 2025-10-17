ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
UPDATE users SET username = COALESCE(username, split_part(email,'@',1)) WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
