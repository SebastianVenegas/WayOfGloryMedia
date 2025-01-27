"use client"

import { createContext, useContext, useReducer, ReactNode } from 'react'

interface BundleItem {
  id: string
  title: string
  price: number
  quantity: number
  image_url?: string
  installation: boolean
  warranty: boolean
}

interface BundleState {
  items: BundleItem[]
  total: number
  itemCount: number
}

type BundleAction =
  | { type: 'ADD_ITEM'; payload: BundleItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_OPTIONS'; payload: { id: string; installation: boolean; warranty: boolean } }
  | { type: 'CLEAR_BUNDLE' }

const initialState: BundleState = {
  items: [],
  total: 0,
  itemCount: 0
}

const calculateTotal = (items: BundleItem[]): number => {
  return items.reduce((total, item) => {
    let itemTotal = item.price * item.quantity
    if (item.installation) itemTotal += 299 // Installation fee
    if (item.warranty) itemTotal += 199 // Warranty fee
    return total + itemTotal
  }, 0)
}

const bundleReducer = (state: BundleState, action: BundleAction): BundleState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      let newItems

      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        newItems = [...state.items, action.payload]
      }

      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((count, item) => count + item.quantity, 0)
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((count, item) => count + item.quantity, 0)
      }
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((count, item) => count + item.quantity, 0)
      }
    }

    case 'UPDATE_OPTIONS': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, installation: action.payload.installation, warranty: action.payload.warranty }
          : item
      )
      return {
        items: newItems,
        total: calculateTotal(newItems),
        itemCount: newItems.reduce((count, item) => count + item.quantity, 0)
      }
    }

    case 'CLEAR_BUNDLE':
      return initialState

    default:
      return state
  }
}

const BundleContext = createContext<{
  state: BundleState
  dispatch: React.Dispatch<BundleAction>
} | undefined>(undefined)

export function BundleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bundleReducer, initialState)

  return (
    <BundleContext.Provider value={{ state, dispatch }}>
      {children}
    </BundleContext.Provider>
  )
}

export function useBundle() {
  const context = useContext(BundleContext)
  if (context === undefined) {
    throw new Error('useBundle must be used within a BundleProvider')
  }
  return context
}

export type { BundleItem, BundleState, BundleAction } 