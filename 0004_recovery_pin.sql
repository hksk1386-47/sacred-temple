-- PIN de recuperação para login sem Google
ALTER TABLE profiles ADD COLUMN recovery_pin TEXT DEFAULT NULL;
