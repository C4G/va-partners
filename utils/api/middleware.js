// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from 'next/server';
import { updateUserLastModified } from "@/utils/api/update-user-last-modified";


export async function middleware(request) {
    // TEMPORARY: Allow all requests for now
    // return NextResponse.next();
    
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (pathname.startsWith('/api/v2/')) {
        const endpointName = pathname.split('/').pop() || 'default';
        await updateUserLastModified(endpointName, request.method,
            token.email);
    }

    return NextResponse.next();
}

// Eventually will work with all pages (other than /)
// and APIs so we don't need to repetitvely check if session != null.
export const config = {
  matcher: [
    '/api/v2/:path*'
  ],
};