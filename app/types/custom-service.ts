export type ServiceCategory = 
  | "Audio" 
  | "Video" 
  | "Lighting" 
  | "Equipment" 
  | "Software" 
  | "Web Development" 
  | "Mobile Apps" 
  | "Consulting" 
  | "Training" 
  | "Support" 
  | "Other"

export type ServiceTier = "Basic" | "Standard" | "Premium" | "Custom"
export type ServiceDuration = "Hourly" | "Daily" | "Weekly" | "Monthly" | "Project-based"

export interface ServiceMetadata {
  targetAudience?: string
  estimatedDuration?: string
  tier?: ServiceTier
  category?: ServiceCategory
  duration?: ServiceDuration
  maxCapacity?: number
  availability?: string[]
  tags?: string[]
  isClientSpecific?: boolean
  clientName?: string | null
}

export type CustomService = {
  id?: string
  title: string
  description: string
  price: number | string
  features: string[]
  category: ServiceCategory
  is_custom: boolean
  created_at?: string
  updated_at?: string
  quantity?: number
  skip_tax?: boolean
  metadata?: ServiceMetadata
  technical_requirements?: string[]
  included_items?: string[]
  prerequisites?: string[]
  cancellation_policy?: string
  minimum_notice_period?: string
  maximum_duration?: string
  location_type?: "onsite" | "remote" | "hybrid"
  skill_level?: "beginner" | "intermediate" | "advanced" | "expert"
  languages?: string[]
  certification_provided?: boolean
  insurance_required?: boolean
  equipment_provided?: boolean
  customization_available?: boolean
  bulk_discount_available?: boolean
  status?: "active" | "draft" | "archived" | "unavailable"
}

// Utility type for service creation/editing
export type ServiceFormData = Omit<CustomService, 'id' | 'created_at' | 'updated_at'> 