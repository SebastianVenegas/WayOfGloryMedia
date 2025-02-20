import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface EmailPreviewProps {
  html: string;
  height?: string;
  width?: string;
  onSendEmail?: () => void;
  isSending?: boolean;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ 
  html, 
  height = '600px', 
  width = '100%',
  onSendEmail,
  isSending = false
}) => {
  // Check if the HTML includes DOCTYPE or html tags
  const isFullHtml = html.includes('<!DOCTYPE') || html.includes('<html');
  
  // If it's not a full HTML document, wrap it with the necessary structure
  const fullHtml = isFullHtml ? html : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            -webkit-font-smoothing: antialiased;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
          }
          p {
            margin: 0 0 16px 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          .content-wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
            box-sizing: border-box;
          }
          table {
            width: 100%;
            max-width: 100%;
            margin-bottom: 1rem;
            border-collapse: collapse;
            table-layout: fixed;
          }
          td, th {
            padding: 8px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          a {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          ${html}
        </div>
      </body>
    </html>
  `;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <iframe
          srcDoc={fullHtml}
          style={{ height, width }}
          sandbox="allow-same-origin allow-scripts"
          title="Email Preview"
          className="bg-white rounded-lg shadow-sm border border-gray-200 w-full"
        />
      </div>
      
      {onSendEmail && (
        <div className="border-t bg-white p-4 shadow-sm mt-4">
          <div className="flex justify-end gap-3 max-w-4xl mx-auto">
            <Button
              onClick={onSendEmail}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPreview; 