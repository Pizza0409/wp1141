import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Wrap handlers to add logging
const { GET: originalGET, POST: originalPOST } = handlers;

export async function GET(request: NextRequest) {
  const url = request.url;
  const pathname = new URL(url).pathname;
  
  // Log all GET requests to auth endpoints
  process.stdout.write('\n');
  console.log('🔵 [SERVER] GET request to:', pathname);
  console.log('🔵 [SERVER] URL:', url);
  
  return originalGET(request);
}

export async function POST(request: NextRequest) {
  const url = request.url;
  const pathname = new URL(url).pathname;
  
  // Log all POST requests to auth endpoints
  process.stdout.write('\n');
  process.stdout.write('═══════════════════════════════════════════════════════════\n');
  console.log('🔵 [SERVER] POST request to:', pathname);
  console.log('🔵 [SERVER] URL:', url);
  
  // Try to read request body
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    if (body) {
      console.log('🔵 [SERVER] Request body:', body);
    }
  } catch (err) {
    console.log('🔵 [SERVER] Could not read request body:', err);
  }
  
  process.stdout.write('═══════════════════════════════════════════════════════════\n');
  
  return originalPOST(request);
}
