'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Editor from '@/components/ui/editor'
import { useToast } from '@/components/ui/use-toast'

interface EmailComposerProps {
  orderId: string
  onEmailSent?: () => void
  initialContent?: string
}

export default function EmailComposer({ orderId, onEmailSent, initialContent = '' }: EmailComposerProps) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleContentChange = (value: string) => {
    // Remove any HTML tags that might have been pasted
    const plainText = value.replace(/<[^>]*>/g, '')
    setContent(plainText)
  }

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both subject and content fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 'custom',
          customEmail: {
            subject: subject.trim(),
            content: content.trim(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send email')
      }

      toast({
        title: 'Success',
        description: 'Email sent successfully',
      })

      // Reset form
      setSubject('')
      setContent('')
      
      // Notify parent component
      if (onEmailSent) {
        onEmailSent()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Compose Custom Email</h3>
      <div className="space-y-3">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="p-4">
              <Editor
                value={content}
                onChange={handleContentChange}
                className="min-h-[500px] prose max-w-none"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Write your email content here. The content will be automatically formatted when sent.
          </p>
        </div>
        <Button
          onClick={handleSendEmail}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Custom Email'}
        </Button>
      </div>
    </div>
  )
} 