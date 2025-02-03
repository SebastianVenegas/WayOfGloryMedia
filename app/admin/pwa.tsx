'use client'

import { useEffect } from 'react'

export function AdminPWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/admin-sw.js', {
          scope: '/admin'
        }).then(
          function(registration) {
            console.log('Admin ServiceWorker registration successful');
          },
          function(err) {
            console.log('Admin ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return null;
} 