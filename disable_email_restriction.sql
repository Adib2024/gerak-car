-- 1. Drop the email restriction trigger to allow ANY email to sign up for testing
DROP TRIGGER IF EXISTS check_email_domain_trigger ON auth.users;

-- Note: The handle_new_user trigger is still active, so new signups will default to 'customer'
