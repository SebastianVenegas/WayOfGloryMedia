import { create } from 'zustand'

interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

interface ServiceSetup {
  customPrice: string
  notes: string
  preferredDate: string
  preferredTime: string
  address: Address
  setCustomPrice: (price: string) => void
  setNotes: (notes: string) => void
  setPreferredDate: (date: string) => void
  setPreferredTime: (time: string) => void
  setAddress: (update: Partial<Address>) => void
  reset: () => void
}

const initialState = {
  customPrice: '',
  notes: '',
  preferredDate: '',
  preferredTime: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  }
}

export const useServiceSetup = create<ServiceSetup>((set) => ({
  ...initialState,
  setCustomPrice: (price) => set({ customPrice: price }),
  setNotes: (notes) => set({ notes }),
  setPreferredDate: (date) => set({ preferredDate: date }),
  setPreferredTime: (time) => set({ preferredTime: time }),
  setAddress: (update) => set((state) => ({
    ...state,
    address: { ...state.address, ...update }
  })),
  reset: () => set(initialState)
})) 