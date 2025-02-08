import React from 'react';

interface EmailPreviewProps {
  html: string;
  height?: string;
  width?: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ html, height = '600px', width = '100%' }) => {
  return (
    <iframe
      srcDoc={html}
      style={{ height, width, border: 'none' }}
      sandbox="allow-same-origin allow-scripts"
      title="Email Preview"
    ></iframe>
  );
};

export default EmailPreview; 