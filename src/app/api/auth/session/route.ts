
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
  }

  // Session expires in 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    if (!auth) {
      return NextResponse.json({ error: 'Auth service not initialized' }, { status: 500 });
    }
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const isProduction = process.env.NODE_ENV === 'production';
    
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set('session', sessionCookie, { 
      httpOnly: true, 
      secure: isProduction, 
      maxAge: expiresIn, 
      path: '/' 
    });

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!auth) {
        return NextResponse.json({ error: 'Auth service not initialized' }, { status: 500 });
    }
    const sessionCookie = request.cookies.get('session');
    const response = NextResponse.json({ status: 'success' });

    if (sessionCookie) {
        // Clear the cookie by setting its maxAge to 0
        response.cookies.set('session', '', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 0, 
            path: '/' 
        });

        // Optional: Revoke the session cookie on the server side
        const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true).catch(() => null);
        if (decodedClaims) {
            await auth.revokeRefreshTokens(decodedClaims.sub);
        }
    }

    return response;
  } catch (error) {
      console.error('Error signing out:', error);
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}
