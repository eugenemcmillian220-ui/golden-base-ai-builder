/**
 * Environment variable validation and access
 * Ensures all required configuration is present and typed correctly
 */

export const env = {
  // Required
  OPENAI_API_KEY: process.env.OPENAI_API_KEY as string,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,

  // Optional but recommended for production
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'bucket-15b05ed1',
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  
  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

/**
 * Validate that all required environment variables are present.
 * Throws an error if any are missing.
 */
export function validateEnv() {
  const required = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `❌ Missing required environment variables: ${missing.join(', ')}. Check your .env file.`;
    console.error(errorMsg);
    
    // Only throw in non-browser environments to prevent client-side crashing during hydration
    if (typeof window === 'undefined') {
      throw new Error(errorMsg);
    }
  } else {
    console.log('✅ Environment variables validated successfully.');
  }
}

// Automatically validate on server-side startup
if (typeof window === 'undefined') {
  validateEnv();
}
