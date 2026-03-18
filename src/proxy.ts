import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // If env vars are missing, continue without session update
    return NextResponse.next({ request });
  }

  try {
    const { updateSession } = await import('@/lib/supabase/middleware');
    return await updateSession(request);
  } catch (error) {
    // If session update fails, continue with request
    console.error('Proxy error:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     * - api routes (handle separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
