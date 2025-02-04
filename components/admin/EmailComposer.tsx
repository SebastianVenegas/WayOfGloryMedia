'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Editor from '@/components/ui/editor'
import { useToast } from '@/components/ui/use-toast'

interface EmailComposerProps {
  orderId: string
  onEmailSent?: () => void
  initialContent?: string
  onContentChange?: (content: string) => void
  onSubjectChange?: (subject: string) => void
  subject?: string
  onClose?: () => void
}

const emailPlaceholder = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
  <p>Dear [Customer Name],</p>

  <p>[Start with a warm greeting and clear purpose for the email]</p>

  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 8px 0;"><strong>Key Information:</strong></p>
    <ul style="margin: 8px 0;">
      <li>Order details or important points</li>
      <li>Relevant dates or deadlines</li>
      <li>Any action items required</li>
    </ul>
  </div>

  <p>[Additional context or instructions if needed]</p>

  <p>If you have any questions or need assistance, please don't hesitate to contact us:</p>
  <ul>
    <li>Phone: (310) 872-9781</li>
    <li>Email: help@wayofglory.com</li>
  </ul>

  <p>Best regards,<br>
  Way of Glory Media Team</p>
</div>
`.trim();

const subjectPlaceholders = [
  "Order #[Number] Update - Way of Glory Media",
  "Your Installation Details - Way of Glory Media",
  "Important Information About Your Order - Way of Glory Media",
  "Thank You for Choosing Way of Glory Media",
  "Way of Glory Media - Service Update"
];

export default function EmailComposer({ 
  orderId, 
  onEmailSent, 
  initialContent = emailPlaceholder, 
  onContentChange,
  onSubjectChange,
  subject: externalSubject,
  onClose
}: EmailComposerProps) {
  const [subject, setSubject] = useState(externalSubject || '')
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent)
    }
  }, [initialContent])

  useEffect(() => {
    if (externalSubject !== undefined) {
      setSubject(externalSubject)
    }
  }, [externalSubject])

  const handleContentChange = (value: string) => {
    const cleanValue = value.replace(/<p><\/p>/g, '<p><br></p>')
    setContent(cleanValue)
    if (onContentChange) {
      onContentChange(cleanValue)
    }
  }

  const handleSubjectChange = (value: string) => {
    setSubject(value)
    if (onSubjectChange) {
      onSubjectChange(value)
    }
  }

  const handleGenerateEmail = async () => {
    try {
      setIsGenerating(true);
      
      // Sanitize the content before sending
      const sanitizedContent = content.trim().replace(/\s+/g, ' ');
      
      if (!sanitizedContent) {
        throw new Error('Email content cannot be empty');
      }

      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          content: sanitizedContent,
          // Add PWA identifier to handle specific validation
          isPWA: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate email');
      }

      const data = await response.json();
      
      // Ensure the response data is properly formatted
      if (!data.html || typeof data.html !== 'string') {
        throw new Error('Invalid email template format');
      }

      setContent(data.html);
      toast({
        title: "Email Generated",
        description: "Your email has been professionally formatted.",
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!content.trim()) {
        throw new Error('Email content cannot be empty');
      }

      // Enhanced sanitization for PWA mode
      const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
      let sanitizedContent = content
        .trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .replace(/\s+/g, ' '); // Normalize whitespace

      // Additional PWA-specific sanitization
      if (isPWA) {
        sanitizedContent = sanitizedContent
          .replace(/&nbsp;/g, ' ')
          .replace(/<p><br><\/p>/g, '<p></p>')
          .replace(/<p><\/p>/g, '<br>')
          .replace(/\r?\n|\r/g, '');
      }

      // Validate content structure
      if (!/^[\s\S]*<[^>]+>[\s\S]*$/.test(sanitizedContent)) {
        throw new Error('Invalid email content structure');
      }

      const response = await fetch(`/api/admin/orders/${orderId}/send-template/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 'custom',
          customEmail: {
            subject: subject || "Payment Reminder",
            html: sanitizedContent,
          },
          isPWA
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });

      if (onEmailSent) {
        onEmailSent();
      }
      
      onClose?.();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Compose Professional Email</h3>
        <div className="text-sm text-gray-500">Order #{orderId}</div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Email Subject
          </label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            placeholder={subjectPlaceholders[Math.floor(Math.random() * subjectPlaceholders.length)]}
            className="w-full transition-colors focus:border-blue-500"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            A clear, professional subject line helps recipients understand the email's purpose
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Email Content
          </label>
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <Editor
              value={content}
              onChange={handleContentChange}
              className="min-h-[400px] prose max-w-none"
            />
          </div>
          <div className="text-sm text-gray-500 mt-2 space-y-2">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Professional Email Tips:
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Start with a clear greeting and purpose</li>
              <li>Keep content concise and well-organized</li>
              <li>Use professional language and tone</li>
              <li>Include all relevant details and contact information</li>
              <li>End with a clear call-to-action if needed</li>
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSendEmail}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors py-5 text-base font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending Email...
              </div>
            ) : (
              'Send Professional Email'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 