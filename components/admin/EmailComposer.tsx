'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Editor from '@/components/ui/editor'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Mail, Send, Eye, X, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import EmailPreview from '@/components/email-preview'

interface EmailLog {
  id: number
  subject: string
  content: string
  sent_at: string
  template_id?: string
  status: string
  preview: string
}

interface EmailComposerProps {
  orderId: string
  onEmailSent?: () => void
  initialContent?: string
  onContentChange?: (content: string) => void
  onSubjectChange?: (subject: string) => void
  subject?: string
  onClose?: () => void
  isTemplateLoading?: boolean
  loadingTemplateName?: string
  activeTab?: 'content' | 'variables' | 'history'
  onTabChange?: (tab: 'content' | 'variables' | 'history') => void
  isSending?: boolean
}

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

const emailPlaceholder = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #374151;">
  <p style="font-size: 16px; margin-bottom: 24px;">Dear [Customer Name],</p>

  <p style="font-size: 16px; margin-bottom: 24px;">From all of us here at Way of Glory Media, we would like to extend our heartfelt gratitude to you for choosing us as your audio and visual solutions partner. Your trust in our services really means a lot to us.</p>

  <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Next Steps</h2>
    <ol style="margin: 0; padding-left: 24px;">
      <li style="margin-bottom: 16px;">
        <strong style="color: #1f2937;">Order Processing:</strong>
        <p style="margin: 8px 0;">Your order is currently pending and is being processed by our team. We will notify you promptly once it goes into the shipment stage.</p>
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1f2937;">Installation Scheduling:</strong>
        <p style="margin: 8px 0;">Your installation has been scheduled for [Installation Date] at [Time]. We will coordinate with you closely to ensure a smooth and hassle-free process.</p>
      </li>
      <li style="margin-bottom: 16px;">
        <strong style="color: #1f2937;">Staying in Touch:</strong>
        <p style="margin: 8px 0;">We will maintain regular communication with you throughout this process. Expect periodic updates from our team to keep you informed about your order status.</p>
      </li>
    </ol>
  </div>

  <p style="font-size: 16px; margin-bottom: 24px;">If at any point you have questions or need assistance, please don't hesitate to reach out to us. Our support team is available at:</p>

  <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <div style="margin-bottom: 12px;">
      <strong style="color: #1f2937;">📧 Email:</strong>
      <a href="mailto:help@wayofglory.com" style="color: #2563eb; text-decoration: none;">help@wayofglory.com</a>
    </div>
    <div>
      <strong style="color: #1f2937;">📱 Phone:</strong>
      <a href="tel:+13108729781" style="color: #2563eb; text-decoration: none;">(310) 872-9781</a>
    </div>
  </div>

  <p style="font-size: 16px; margin-bottom: 24px;">We're here to serve you! As we gear up for the upcoming installation, we can't help but feel excited about the transformative worship experiences you'll be able to create with our solutions.</p>

  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; color: #4b5563;">Best regards,</p>
    <p style="margin: 8px 0 0; font-weight: 600; color: #1f2937;">The Way of Glory Media Team</p>
  </div>
</div>
`.trim();

const subjectPlaceholders = [
  "Order #[Number] Update - Way of Glory Media",
  "Your Installation Details - Way of Glory Media", 
  "Important Information About Your Order - Way of Glory Media",
  "Thank You for Choosing Way of Glory Media",
  "Way of Glory Media - Service Update"
];

const animationStyles = {
  checkmark: 'animate-[scale_0.3s_ease-in-out]',
  successText: 'animate-[fadeIn_0.5s_ease-in-out]',
  shimmer: 'animate-[shimmer_2s_linear_infinite]',
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Add the keyframes to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

export default function EmailComposer({ 
  orderId, 
  onEmailSent, 
  initialContent = emailPlaceholder, 
  onContentChange,
  onSubjectChange,
  subject: externalSubject,
  onClose,
  isTemplateLoading = false,
  loadingTemplateName = '',
  activeTab = 'content',
  onTabChange,
  isSending = false
}: EmailComposerProps) {
  const [subject, setSubject] = useState(externalSubject || '')
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
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

  const handleGenerateEmail = async (event?: React.MouseEvent) => {
    try {
      setIsGenerating(true);
      
      // Prevent default form submission behavior
      event?.preventDefault?.();
      
      // Sanitize the content before sending
      const sanitizedContent = content.trim().replace(/\s+/g, ' ');
      
      if (!sanitizedContent) {
        throw new Error('Email content cannot be empty');
      }

      const isPWA = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('/api/admin/generate-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(isPWA ? { 
              'x-pwa-request': 'true',
              'Cache-Control': 'no-store',
              'Pragma': 'no-cache'
            } : {}),
          },
          body: JSON.stringify({
            orderId,
            content: sanitizedContent,
            isPWA
          }),
          signal: controller.signal,
          // Prevent caching in PWA
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate email');
        }

        const data = await response.json();
        
        // Ensure the response data is properly formatted
        if (!data.html || typeof data.html !== 'string') {
          throw new Error('Invalid email template format');
        }

        // Update state in a safe way
        setContent(prevContent => {
          const newContent = data.html;
          if (onContentChange) {
            onContentChange(newContent);
          }
          return newContent;
        });

        if (data.subject) {
          setSubject(prevSubject => {
            const newSubject = data.subject;
            if (onSubjectChange) {
              onSubjectChange(newSubject);
            }
            return newSubject;
          });
        }
        
        toast({
          title: "Email Generated",
          description: "Your email has been professionally formatted.",
        });
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
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
      setSendStatus('loading')
      setIsLoading(true);
      
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

      const response = await fetch(`/api/admin/orders/${orderId}/send-template`, {
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

      setSendStatus('success');
      
      // Show success toast
      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully.",
      });

      // Wait for success animation to complete
      setTimeout(() => {
        if (onEmailSent) {
          onEmailSent();
        }
        onClose?.();
      }, 1500);

    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus('error');
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/admin/orders/${orderId}/email-logs`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch email logs')
      }
      const data = await response.json()
      setEmailLogs(data)
    } catch (error) {
      console.error('Error fetching email logs:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch email logs",
        variant: "destructive"
      })
    } finally {
      setIsLoadingLogs(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    fetchEmailLogs()
  }, [orderId, fetchEmailLogs])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleEmailLogClick = (log: EmailLog) => {
    setSubject(log.subject);
    // Ensure we're using the fully formatted HTML content
    const htmlContent = log.content;
    
    // If the content doesn't have the order details section, fetch and format it
    fetch(`/api/admin/orders/${orderId}/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: 'custom',
        customEmail: {
          subject: log.subject,
          html: log.content,
          formatOnly: true
        }
      }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.html) {
        setContent(data.html);
        if (onContentChange) onContentChange(data.html);
      }
    })
    .catch(error => {
      console.error('Error formatting email:', error);
      // Fallback to original content if formatting fails
      setContent(htmlContent);
      if (onContentChange) onContentChange(htmlContent);
    });
    
    if (onSubjectChange) onSubjectChange(log.subject);
    if (onTabChange) onTabChange('content');
  };

  const handleUseTemplate = (log: EmailLog) => {
    handleEmailLogClick(log);
  };

  const renderEmailHistory = () => (
    <div className="p-6">
      {isLoadingLogs ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-blue-600/30 border-t-blue-600"></div>
        </div>
      ) : emailLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No emails yet</p>
          <p className="text-sm text-gray-500 mt-1">Sent emails will appear here</p>
        </div>
      ) : (
        <div className="divide-y">
          {emailLogs.map((log) => (
            <div key={log.id} className="py-4 first:pt-0 hover:bg-gray-50 px-4 -mx-4 cursor-pointer transition-colors" onClick={() => handleEmailLogClick(log)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-medium text-gray-900 truncate">{log.subject}</h4>
                    <time className="text-xs text-gray-500 whitespace-nowrap">{formatDate(log.sent_at)}</time>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{log.preview}</p>
                  {log.template_id && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {log.template_id.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="p-6 space-y-6">
      {/* Subject Input */}
      <div className="space-y-2">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          placeholder={subjectPlaceholders[0]}
          className="w-full"
          disabled={isGenerating || isLoading || isTemplateLoading}
        />
      </div>

      {/* Email Content */}
      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Email Content
        </label>
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {activeTab === 'content' ? (
            <div className="p-6 relative">
              {(isTemplateLoading || isGenerating || isLoading || isSending) && (
                <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]" />
                      <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_1.5s_linear_infinite] absolute inset-0" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                          <div className="absolute inset-0 animate-ping">
                            <Sparkles className="h-8 w-8 text-blue-500/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        <div className="flex flex-col items-center gap-2">
                          <span>
                            {isSending ? "Sending Email..." : 
                             isTemplateLoading ? loadingTemplateName : 
                             "Generating Custom Email"}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite]" />
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.2s]" />
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-[bounce_1.4s_infinite_0.4s]" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">This may take a few moments</p>
                    </div>
                  </div>
                </div>
              )}
              <Editor
                value={content}
                onChange={handleContentChange}
                className="min-h-[400px] prose max-w-none focus:outline-none"
                disabled={isGenerating || isLoading || isTemplateLoading}
              />
              <div className="mt-4 flex justify-end">
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateEmail(e);
                    return false;
                  }} 
                  disabled={isGenerating || isTemplateLoading}
                  className="relative"
                >
                  <span className={isGenerating ? 'opacity-0' : 'opacity-100'}>
                    Generate with AI
                  </span>
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <span>Generating</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <EmailPreview html={content} height="600px" width="100%" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto bg-white">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 relative backdrop-blur-none">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="px-6 py-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTab === 'content' ? 'default' : 'outline'}
                  onClick={() => onTabChange?.('content')}
                >
                  Content
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'default' : 'outline'}
                  onClick={() => onTabChange?.('history')}
                >
                  History
                </Button>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">Create a professional email to send to your customer</p>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'content' && renderContent()}
          {activeTab === 'history' && renderEmailHistory()}
        </div>
      </div>
    </div>
  );
}