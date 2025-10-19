# AWS Cognito Authentication Setup

This application now includes AWS Cognito authentication that prompts users to login or signup when the app starts.

## Configuration

The AWS Cognito User Pool is already configured in `src/services/auth.ts`:

-   **User Pool ID**: `eu-north-1_zvrOx96oo`
-   **Client ID**: `66n0aek0547h9smp9jna3mf7mr`
-   **Region**: `eu-north-1` (Europe - Stockholm)

## Features Implemented

### 1. Authentication Service (`src/services/auth.ts`)

-   **Sign Up**: Register new users with username, email, and password
-   **Sign In**: Authenticate existing users
-   **Email Verification**: Confirm user registration with verification code
-   **Session Management**: Get current user session and attributes
-   **Sign Out**: End user session
-   **Resend Confirmation**: Resend verification code if needed

### 2. Auth Component (`src/components/Auth.tsx`)

A beautiful, modern authentication UI with three modes:

-   **Sign In**: For existing users
-   **Sign Up**: For new user registration
-   **Email Verification**: For confirming email with verification code

### 3. App Integration (`src/App.tsx`)

-   Checks authentication status on startup
-   Shows loading screen while checking session
-   Displays auth screen if not authenticated
-   Shows main app dashboard if authenticated
-   Passes sign-out handler to Dashboard

### 4. Dashboard Integration

-   Added "Sign Out" button to the dashboard header
-   Clicking sign out returns user to login screen

## User Flow

1. **First Time Users**:

    - App starts → Auth screen appears
    - User clicks "Sign Up"
    - Enters username, email, and password (min 8 chars, must include uppercase, lowercase, and number)
    - Receives verification code via email
    - Enters verification code
    - Can now sign in

2. **Returning Users**:

    - App starts → Checks for existing session
    - If valid session exists → Goes directly to Dashboard
    - If no session → Shows login screen
    - User enters credentials → Dashboard loads

3. **Sign Out**:
    - User clicks "Sign Out" button in dashboard header
    - Returns to login screen
    - Must authenticate again to access app

## Security Notes

-   Passwords must be at least 8 characters with uppercase, lowercase, and numbers
-   Sessions are managed by AWS Cognito
-   User pool is configured in the EU (Stockholm) region
-   Client secret is available but not used (client-side apps typically don't require it)

## Cognito User Pool Settings

If you need to modify the Cognito settings:

1. Go to AWS Console → Cognito
2. Select User Pool: `eu-north-1_zvrOx96oo`
3. Configure password policies, MFA, email templates, etc.

## Troubleshooting

### "UserNotConfirmedException"

-   User signed up but hasn't verified their email
-   App automatically switches to verification mode
-   User should check email for verification code

### "NotAuthorizedException"

-   Incorrect username or password
-   Check credentials and try again

### "UsernameExistsException"

-   Username is already taken
-   Try a different username

### Email Not Received

-   Check spam folder
-   Use "Resend Code" button in verification screen
-   Verify email configuration in Cognito User Pool

## Password Requirements

AWS Cognito default password policy requires:

-   Minimum length: 8 characters
-   At least one uppercase letter
-   At least one lowercase letter
-   At least one number

## Next Steps (Optional Enhancements)

1. **Forgot Password**: Add password reset functionality
2. **Remember Me**: Add persistent sessions
3. **Social Login**: Add Google, Facebook, etc.
4. **Multi-Factor Authentication**: Add MFA for extra security
5. **User Profile**: Add profile management screen
6. **Email Templates**: Customize verification email templates
