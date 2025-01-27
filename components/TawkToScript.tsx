'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function TawkToScript() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return null
  }

  return (
    <Script id="tawk-script" strategy="lazyOnload">
      {`
        var Tawk_API = Tawk_API || {};
        Tawk_API.onLoad = function() {
            if (!Tawk_API.isChatHidden) {
                Tawk_API.hideWidget();
            }
        };
        Tawk_API.onChatMaximized = function() {
            // Ensure chat elements are loaded before accessing
            setTimeout(() => {
                if (document.querySelector('#tawkchat-message-container')) {
                    Tawk_API.toggleChat();
                }
            }, 100);
        };
        var Tawk_LoadStart = new Date();
        (function(){
            var s1 = document.createElement("script"),
                s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/678dd04f825083258e07a8de/1ii0vbdjk';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  )
} 