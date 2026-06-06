import csurf from 'csurf';

// Export the standard csurf middleware with cookie options only.
// The custom token generator and manual verification were invalid and caused type errors.
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true
  }
});