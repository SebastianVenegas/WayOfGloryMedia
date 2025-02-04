export type CustomService = {
  id?: string
  title: string
  description: string
  price: number | string
  features: string[]
  category: string
  is_custom: boolean
  created_at?: string
  updated_at?: string
  quantity?: number
  skip_tax?: boolean
} 