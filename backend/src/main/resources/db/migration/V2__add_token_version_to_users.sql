-- Lets a password reset invalidate already-issued JWT access tokens
-- immediately (see PasswordResetService / JwtAuthenticationFilter) instead of
-- only revoking refresh tokens and waiting for the access token to expire.
ALTER TABLE users ADD COLUMN token_version integer NOT NULL DEFAULT 0;
