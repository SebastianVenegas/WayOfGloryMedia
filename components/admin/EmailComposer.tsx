'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Editor from '@/components/ui/editor'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Mail, Send, Eye, X, Sparkles, Loader2, Settings, Package, User, Code, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import EmailPreview from '@/components/email-preview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  isAiPromptOpen?: boolean
  onAiPromptOpenChange?: (open: boolean) => void
  onAiPromptSubmit?: (prompt: string) => void
  isGeneratingAI?: boolean
  previewHtml?: string
  onPreviewHtmlChange?: (html: string) => void
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

const enhancePrompt = (prompt: string): string => {
  // Extract key components from the prompt
  const purpose = prompt.toLowerCase();
  const isPaymentRelated = purpose.includes('payment') || purpose.includes('invoice');
  const isInstallationRelated = purpose.includes('installation') || purpose.includes('setup');
  const isUpdateRelated = purpose.includes('update') || purpose.includes('status');
  const isThankYouRelated = purpose.includes('thank') || purpose.includes('appreciation');
  
  // Build enhanced prompt based on type
  let enhancedPrompt = 'Write a professional and engaging email that';
  
  if (isPaymentRelated) {
    enhancedPrompt = `Create a polite and clear payment-related email that ${purpose}. Include:
- Specific payment details and methods
- Clear deadlines if applicable
- Professional payment instructions
- Maintain a courteous tone while conveying urgency`;
  } else if (isInstallationRelated) {
    enhancedPrompt = `Compose a detailed installation communication that ${purpose}. Include:
- Clear preparation instructions
- Specific installation details
- Safety and access requirements
- What to expect during the process`;
  } else if (isUpdateRelated) {
    enhancedPrompt = `Draft a comprehensive status update that ${purpose}. Include:
- Current status details
- Next steps and timeline
- Clear expectations
- Proactive addressing of common concerns`;
  } else if (isThankYouRelated) {
    enhancedPrompt = `Craft a sincere appreciation message that ${purpose}. Include:
- Genuine gratitude expression
- Specific references to their business
- Future relationship building
- Open door for feedback`;
  } else {
    enhancedPrompt = `Compose a professional and detailed email that ${purpose}. Include:
- Clear and specific information
- Action items if applicable
- Next steps
- Relevant contact details`;
  }
  
  return enhancedPrompt + '\n\nMaintain a warm, professional tone throughout the email.';
};

const improvePromptWithAI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/admin/improve-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemPrompt: `You are an expert at improving email prompts. Make the prompt more specific and actionable. Keep it concise and clear.

Rules:
1. Return ONLY the improved prompt text
2. No formatting, bullets, or special characters
3. Keep it under 3 sentences
4. Focus on key details and tone
5. Be direct and specific

Example input: "Write a thank you email"
Example output: "Write a warm thank you email expressing gratitude for their order, mentioning the specific products purchased, and inviting them to reach out with any questions."

Improve this prompt:`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to improve prompt');
    }

    const data = await response.json();
    return data.improvedPrompt;
  } catch (error) {
    console.error('Error improving prompt:', error);
    throw error;
  }
};

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
  isSending = false,
  isAiPromptOpen = false,
  onAiPromptOpenChange,
  onAiPromptSubmit,
  isGeneratingAI = false,
  previewHtml: externalPreviewHtml,
  onPreviewHtmlChange
}: EmailComposerProps) {
  const [content, setContent] = useState(initialContent)
  const [subject, setSubject] = useState(externalSubject || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [aiPrompt, setAiPrompt] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [previewHtml, setPreviewHtml] = useState(externalPreviewHtml || initialContent)
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false)

  useEffect(() => {
    if (externalPreviewHtml !== undefined) {
      setPreviewHtml(externalPreviewHtml)
    }
  }, [externalPreviewHtml])

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent)
      if (!externalPreviewHtml) {
        setPreviewHtml(initialContent)
      }
      // Only clear loading state if we actually have content
      if (isTemplateLoading && initialContent.trim()) {
        setTimeout(() => {
          setIsGenerating(false)
        }, 500)
      }
    }
  }, [initialContent, isTemplateLoading, externalPreviewHtml])

  // Update loading states when isTemplateLoading changes
  useEffect(() => {
    if (isTemplateLoading) {
      setIsGenerating(true)
      // Set a loading preview if we don't have content yet
      if (!content.trim()) {
        setPreviewHtml('<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div><p class="text-gray-500">Loading template...</p></div></div>')
      }
    } else {
      // Only clear loading state if we have content
      if (content.trim()) {
        setTimeout(() => {
          setIsGenerating(false)
        }, 500)
      }
    }
  }, [isTemplateLoading, content])

  useEffect(() => {
    if (externalSubject !== undefined) {
      setSubject(externalSubject)
    }
  }, [externalSubject])

  // Handle view mode changes
  useEffect(() => {
    // Clear loading states when switching to preview mode
    if (viewMode === 'preview') {
      setIsGenerating(false)
    }
  }, [viewMode])

  // Handle content changes
  const handleContentChange = (value: string) => {
    const cleanValue = value.replace(/<p><\/p>/g, '<p><br></p>')
    setContent(cleanValue)
    if (!externalPreviewHtml) {
      setPreviewHtml(cleanValue)
    }
    if (onContentChange) {
      onContentChange(cleanValue)
    }
    if (onPreviewHtmlChange) {
      onPreviewHtmlChange(cleanValue)
    }
    // Clear loading state if we have content
    if (isGenerating && cleanValue.trim()) {
      setTimeout(() => {
        setIsGenerating(false)
      }, 500)
    }
  }

  // Handle subject changes
  const handleSubjectChange = (value: string) => {
    setSubject(value)
    if (onSubjectChange) {
      onSubjectChange(value)
    }
  }

  // Handle view mode toggle
  const handleViewModeToggle = (mode: 'edit' | 'preview') => {
    // Clear loading state when switching modes
    setIsGenerating(false)
    setViewMode(mode)
  }

  // Handle errors
  const handleError = (error: unknown, action: string) => {
    console.error(`Error ${action}:`, error)
    let errorMessage = 'An unexpected error occurred. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    })
  }

  // Handle email sending
  const handleSendEmail = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your email before sending.",
        variant: "destructive"
      })
      return
    }

    setIsSendingEmail(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pwa-request': 'true'
        },
        body: JSON.stringify({
          customEmail: {
            subject: subject,
            content: content,
            html: content
          }
        })
      })

      const data = await response.json()

      if (response.ok || data.html || data.content) {
        toast({
          title: "Success",
          description: "Email sent successfully!",
          variant: "default"
        })
        if (onEmailSent) {
          onEmailSent()
        }
        return
      }

      throw new Error(data.error || 'Failed to send email')
    } catch (error) {
      handleError(error, 'sending email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Handle AI prompt dialog
  useEffect(() => {
    if (!isAiPromptOpen) {
      setAiPrompt('')
      setIsImprovingPrompt(false)
    }
  }, [isAiPromptOpen])

  // Handle AI prompt submission
  const handleAiPromptSubmit = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt before generating.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setPreviewHtml('<div class="flex items-center justify-center min-h-[400px]"><div class="text-center"><div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div><p class="text-gray-500">Generating email with AI...</p></div></div>')

    try {
      if (onAiPromptSubmit) {
        await onAiPromptSubmit(prompt)
      }
      // Close the dialog after successful generation
      if (onAiPromptOpenChange) {
        onAiPromptOpenChange(false)
      }
    } catch (error) {
      handleError(error, 'generating with AI')
      setIsGenerating(false)
    }
  }

  // Handle prompt improvement
  const handleImprovePrompt = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to improve.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsImprovingPrompt(true)
      const improvedPrompt = await improvePromptWithAI(aiPrompt)
      setAiPrompt(improvedPrompt)
    } catch (error) {
      handleError(error, 'improving prompt')
    } finally {
      setIsImprovingPrompt(false)
    }
  }

  const fetchEmailLogs = useCallback(async () => {
    if (!orderId) return;
    
    const maxRetries = 2;
    let currentTry = 0;

    const attemptFetch = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/email-logs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-pwa-request': 'true'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Email logs response error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setEmailLogs(data);
        } else {
          console.warn('Email logs data is not an array:', data);
          setEmailLogs([]);
        }
        return true;
      } catch (error) {
        console.error(`Attempt ${currentTry + 1} failed:`, error);
        if (currentTry < maxRetries) {
          currentTry++;
          await new Promise(resolve => setTimeout(resolve, 1000 * currentTry)); // Exponential backoff
          return false;
        }
        throw error;
      }
    };

    try {
      setIsLoadingLogs(true);
      let success = false;
      
      while (currentTry <= maxRetries && !success) {
        success = await attemptFetch();
      }

      if (!success) {
        throw new Error('Failed to fetch email logs after retries');
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      setEmailLogs([]);
      toast?.({
        title: "Error loading email history",
        description: "There was a problem loading the email history. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    if (orderId) {
      fetchEmailLogs();
    }
  }, [orderId, fetchEmailLogs]);

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
    // Just load the content into the editor
    setSubject(log.subject);
    setContent(log.content);
    setViewMode('edit');
    
    // Update parent component if callbacks are provided
    if (onContentChange) onContentChange(log.content);
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
          disabled={isGenerating || isTemplateLoading}
        />
      </div>

      {/* Email Content */}
      {viewMode === 'edit' ? (
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Email Content
          </label>
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="p-6 relative">
              {/* Editor Container */}
              <div className="relative" style={{ height: 'calc(100vh - 400px)' }}>
                {(isTemplateLoading || isGenerating || isSendingEmail) ? (
                  <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <div className="flex flex-col items-center gap-1">
                        <span>
                          {isSendingEmail ? "Sending Email..." : 
                           isTemplateLoading ? loadingTemplateName || "Loading Template..." : 
                           isGenerating ? "Generating Email..." :
                           "Processing..."}
                        </span>
                        <span className="text-sm text-gray-500">Please wait...</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Editor
                    value={content}
                    onChange={handleContentChange}
                    className="min-h-[400px] prose max-w-none focus:outline-none"
                    disabled={isGenerating || isTemplateLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="preview" className="block text-sm font-medium text-gray-700">
            Email Preview
          </label>
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="p-6 relative">
              {(isTemplateLoading || isGenerating) ? (
                <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <div className="flex flex-col items-center gap-1">
                      <span>
                        {isTemplateLoading ? loadingTemplateName || "Loading Template..." : 
                         isGenerating ? "Generating Preview..." :
                         "Processing..."}
                      </span>
                      <span className="text-sm text-gray-500">Please wait...</span>
                    </div>
                  </div>
                </div>
              ) : !previewHtml ? (
                <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                  <div className="flex flex-col items-center gap-4">
                    <Info className="h-8 w-8 text-gray-400" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-gray-500">No preview available</span>
                      <span className="text-sm text-gray-400">Switch to edit mode to create content</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmailPreview 
                  html={previewHtml} 
                  height="calc(100vh - 400px)" 
                  width="100%" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto bg-white">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 relative backdrop-blur-none">
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => onTabChange?.(value as 'content' | 'variables' | 'history')} 
          className="w-full flex flex-col flex-1"
        >
          {/* Header */}
          <div className="border-b bg-white">
            <div className="px-6 py-4 bg-white">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">Create a professional email to send to your customer</p>
            </div>
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-3 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/80 shadow-sm">
                <TabsTrigger 
                  value="content" 
                  className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200/70 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/60"
                >
                  <Mail className="w-4 h-4" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="variables" 
                  className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200/70 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/60"
                >
                  <Settings className="w-4 h-4" />
                  <span>Variables</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200/70 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/60"
                >
                  <Clock className="w-4 h-4" />
                  <span>History</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="h-4"></div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50">
            <TabsContent value="content" className="mt-0 h-full">
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
                    disabled={isGenerating || isTemplateLoading}
                  />
                </div>

                {/* Email Content */}
                {viewMode === 'edit' ? (
                  <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Email Content
                    </label>
                    <div className="rounded-xl border bg-white shadow-sm">
                      <div className="p-6 relative">
                        {/* Editor Container */}
                        <div className="relative" style={{ height: 'calc(100vh - 400px)' }}>
                          {(isTemplateLoading || isGenerating || isSendingEmail) ? (
                            <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                              <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <div className="flex flex-col items-center gap-1">
                                  <span>
                                    {isSendingEmail ? "Sending Email..." : 
                                     isTemplateLoading ? loadingTemplateName || "Loading Template..." : 
                                     isGenerating ? "Generating Email..." :
                                     "Processing..."}
                                  </span>
                                  <span className="text-sm text-gray-500">Please wait...</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Editor
                              value={content}
                              onChange={handleContentChange}
                              className="min-h-[400px] prose max-w-none focus:outline-none"
                              disabled={isGenerating || isTemplateLoading}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="preview" className="block text-sm font-medium text-gray-700">
                      Email Preview
                    </label>
                    <div className="rounded-xl border bg-white shadow-sm">
                      <div className="p-6 relative">
                        {(isTemplateLoading || isGenerating) ? (
                          <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                            <div className="flex flex-col items-center gap-4">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                              <div className="flex flex-col items-center gap-1">
                                <span>
                                  {isTemplateLoading ? loadingTemplateName || "Loading Template..." : 
                                   isGenerating ? "Generating Preview..." :
                                   "Processing..."}
                                </span>
                                <span className="text-sm text-gray-500">Please wait...</span>
                              </div>
                            </div>
                          </div>
                        ) : !previewHtml ? (
                          <div className="min-h-[400px] border rounded-lg bg-white p-6 flex items-center justify-center prose-sm">
                            <div className="flex flex-col items-center gap-4">
                              <Info className="h-8 w-8 text-gray-400" />
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-500">No preview available</span>
                                <span className="text-sm text-gray-400">Switch to edit mode to create content</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <EmailPreview 
                            html={previewHtml} 
                            height="calc(100vh - 400px)" 
                            width="100%" 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with buttons - Always visible */}
              <div className="border-t bg-white p-4 shadow-sm">
                <div className="flex justify-end gap-3 max-w-4xl mx-auto">
                  {viewMode === 'edit' && (
                    <Dialog open={isAiPromptOpen} onOpenChange={onAiPromptOpenChange}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="gap-2 bg-white hover:bg-gray-50"
                          onClick={() => onAiPromptOpenChange?.(true)}
                          disabled={isGenerating || isTemplateLoading || isSendingEmail}
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate with AI
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] bg-white/80 backdrop-blur-lg border border-gray-200/50 shadow-xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Generate Email with AI
                          </DialogTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Describe the type of email you want to generate. Be specific about the purpose and tone.
                          </p>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="prompt" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              Email Description
                            </label>
                            <div className="relative">
                              <textarea
                                id="prompt"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Examples:
- Write a friendly payment reminder for the overdue balance
- Send an update about the delayed shipment with a new ETA
- Compose a thank you note for their recent purchase
- Draft an installation confirmation with preparation steps"
                                className="w-full h-32 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 text-sm"
                              />
                              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleImprovePrompt}
                                  className="h-7 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                  disabled={!aiPrompt.trim() || isImprovingPrompt}
                                >
                                  {isImprovingPrompt ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Improving...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      Improve Prompt
                                    </>
                                  )}
                                </Button>
                                <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  AI Powered
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-2">
                              <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Available Variables
                              </h4>
                              <div className="space-y-2">
                                <div className="space-y-1.5">
                                  <code className="px-1.5 py-0.5 bg-blue-100/50 rounded text-blue-700 text-xs block">[Customer Name]</code>
                                  <code className="px-1.5 py-0.5 bg-blue-100/50 rounded text-blue-700 text-xs block">[Order Number]</code>
                                  <code className="px-1.5 py-0.5 bg-blue-100/50 rounded text-blue-700 text-xs block">[Total Amount]</code>
                                </div>
                              </div>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-2">
                              <h4 className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Additional Details
                              </h4>
                              <div className="space-y-2">
                                <div className="space-y-1.5">
                                  <code className="px-1.5 py-0.5 bg-emerald-100/50 rounded text-emerald-700 text-xs block">[Installation Date]</code>
                                  <code className="px-1.5 py-0.5 bg-emerald-100/50 rounded text-emerald-700 text-xs block">[Status]</code>
                                  <code className="px-1.5 py-0.5 bg-emerald-100/50 rounded text-emerald-700 text-xs block">[Company Info]</code>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Writing Tips
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                Be specific about the email's purpose and desired tone
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                Include any key information that should be emphasized
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                Mention if you need specific sections or formatting
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                          <Button 
                            variant="outline" 
                            onClick={() => onAiPromptOpenChange?.(false)}
                            className="bg-white/50 backdrop-blur-sm hover:bg-gray-50"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleAiPromptSubmit(aiPrompt)}
                            disabled={isGeneratingAI || !aiPrompt.trim()}
                            className="bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 min-w-[120px]"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    onClick={handleSendEmail}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={isGenerating || isTemplateLoading || isSendingEmail}
                  >
                    {isSendingEmail ? (
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
            </TabsContent>

            <TabsContent value="variables" className="mt-0 h-full">
              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">Available Variables</h3>
                    <p className="text-sm text-gray-500">Use these variables to personalize your email content</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Package className="w-4 h-4" />
                        <h4 className="font-medium">Order Details</h4>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Order Number]</code>
                          <span className="text-sm text-gray-600">Order reference number</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Installation Date]</code>
                          <span className="text-sm text-gray-600">Scheduled installation date</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Installation Time]</code>
                          <span className="text-sm text-gray-600">Scheduled installation time</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Total Amount]</code>
                          <span className="text-sm text-gray-600">Order total amount</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        <User className="w-4 h-4" />
                        <h4 className="font-medium">Customer Details</h4>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Customer Name]</code>
                          <span className="text-sm text-gray-600">Customer's full name</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Organization]</code>
                          <span className="text-sm text-gray-600">Customer's organization</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Email]</code>
                          <span className="text-sm text-gray-600">Customer's email</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">[Phone]</code>
                          <span className="text-sm text-gray-600">Customer's phone number</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 h-full">
              <div className="max-w-4xl mx-auto">
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-[spin_3s_linear_infinite]" />
                        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-[spin_1.5s_linear_infinite] absolute inset-0" />
                      </div>
                      <p className="text-sm text-gray-500">Loading email history...</p>
                    </div>
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
                      <div 
                        key={log.id} 
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleEmailLogClick(log)}
                      >
                        <div className="flex items-start gap-4 max-w-4xl mx-auto">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
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
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}