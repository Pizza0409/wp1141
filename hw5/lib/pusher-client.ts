'use client';

import { useEffect, useState } from 'react';
import PusherClient from 'pusher-js';

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher client can only be used on the client side');
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
  }

  return pusherClientInstance;
}

