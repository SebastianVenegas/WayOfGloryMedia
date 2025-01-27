'use client'

import { useState, useEffect } from 'react'
import { Package, Loader2, Search, ChevronLeft, ChevronRight, Filter, Plus, ShoppingBag, Minus, X, LayoutGrid, List, CheckCircle2, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductModal from "@/components/ui/product-modal"
import Bundle from "@/components/Bundle"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import Checkout, { CheckoutFormData } from '@/components/Checkout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Category type definitions
type MainCategory = 'all' | 'Audio Gear' | 'Streaming Gear' | 'Services';

interface SubCategory {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface CategoryConfig {
  name: string;
  subcategories: SubCategory[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
  'Audio Gear': {
    name: 'Audio Gear',
    subcategories: [
      { name: 'Microphones', path: 'Audio Gear/Mics' },
      { name: 'Mixers', path: 'Audio Gear/Mixers' },
      { name: 'Cables', path: 'Audio Gear/Cables' },
      { name: 'Snakes', path: 'Audio Gear/Snakes' },
      { name: 'Speakers', path: 'Audio Gear/Speakers' },
      { name: 'IEMS', path: 'Audio Gear/IEMS' },
      { name: 'Stands', path: 'Audio Gear/Stands' }
    ]
  }
};

type CategoryType = MainCategory | string;

// Filter function for categories
const filterByCategory = (product: Product, selectedCategory: CategoryType): boolean => {
  if (selectedCategory === 'all') return true;
  
  // Main category
  if (selectedCategory === 'Audio Gear') {
    return product.category.startsWith('Audio Gear/');
  }
  
  // Exact subcategory match
  return product.category === selectedCategory;
};

// Product images mapping
export const productImages = {
  'proco-stagemaster-32-4': [
    '/images/products/proco-stagemaster-32-4/proco-stagemaster-32-4-1.jpg',
    '/images/products/proco-stagemaster-32-4/proco-stagemaster-32-4-2.jpg',
    '/images/products/proco-stagemaster-32-4/proco-stagemaster-32-4-3.jpg'
  ],
  'hosa-hss-005x': [
    '/images/products/hosa-hss-005x/hosa-hss-005x-1.jpg',
    '/images/products/hosa-hss-005x/hosa-hss-005x-2.jpg',
    '/images/products/hosa-hss-005x/hosa-hss-005x-3.jpg'
  ],
  'behringer-s32': [
    '/images/products/behringer-s32/behringer-s32-1.jpg',
    '/images/products/behringer-s32/behringer-s32-2.jpg',
    '/images/products/behringer-s32/behringer-s32-3.jpg'
  ],
  'whirlwind-m-32-4': [
    '/images/products/whirlwind-m-32-4/whirlwind-m-32-4-1.jpg',
    '/images/products/whirlwind-m-32-4/whirlwind-m-32-4-2.jpg',
    '/images/products/whirlwind-m-32-4/whirlwind-m-32-4-3.jpg'
  ],
  'allen-heath-ab168': [
    '/images/products/allen-heath-ab168/allen-heath-ab168-1.jpg',
    '/images/products/allen-heath-ab168/allen-heath-ab168-2.jpg',
    '/images/products/allen-heath-ab168/allen-heath-ab168-3.jpg'
  ],
  'allen-heath-dx168': [
    '/images/products/allen-heath-dx168/allen-heath-dx168-1.jpg',
    '/images/products/allen-heath-dx168/allen-heath-dx168-2.jpg',
    '/images/products/allen-heath-dx168/allen-heath-dx168-3.jpg'
  ],
  'midas-dl16-dl32': [
    '/images/products/midas-dl16-dl32/midas-dl16-dl32-1.jpg',
    '/images/products/midas-dl16-dl32/midas-dl16-dl32-2.jpg',
    '/images/products/midas-dl16-dl32/midas-dl16-dl32-3.jpg'
  ],
  'yamaha-mg12x': [
    '/images/products/yamaha-mg12x/yamaha-mg12x-1.jpg',
    '/images/products/yamaha-mg12x/yamaha-mg12x-2.jpg',
    '/images/products/yamaha-mg12x/yamaha-mg12x-3.jpg'
  ],
  'yamaha-mgp32x': [
    '/images/products/yamaha-mgp32x/yamaha-mgp32x-1.jpg',
    '/images/products/yamaha-mgp32x/yamaha-mgp32x-2.jpg',
    '/images/products/yamaha-mgp32x/yamaha-mgp32x-3.jpg'
  ],
  'focusrite-scarlett-2i2-3rd-gen': [
    '/images/products/focusrite-scarlett-2i2-3rd-gen/scarlett-2i2-1.jpg',
    '/images/products/focusrite-scarlett-2i2-3rd-gen/scarlett-2i2-2.jpg',
  ],
  'yamaha-mg10xu': [
    '/images/products/yamaha-mg10xu/yamaha-mg10xu-1.jpg',
    '/images/products/yamaha-mg10xu/yamaha-mg10xu-2.jpg',
    '/images/products/yamaha-mg10xu/yamaha-mg10xu-3.jpg'
  ],
  'behringer-x32-digital-mixer': [
    '/images/products/Behringer-X32-Digital-Mixer/behringer-x32-1.jpg',
    '/images/products/Behringer-X32-Digital-Mixer/behringer-x32-2.jpg',
    '/images/products/Behringer-X32-Digital-Mixer/behringer-x32-3.jpg'
  ],
  'zoom-livetrak-l-12': [
    '/images/products/zoom-livetrak-l-12/zoom-livetrak-l12-1.jpg',
    '/images/products/zoom-livetrak-l-12/zoom-livetrak-l12-2.jpg',
    '/images/products/zoom-livetrak-l-12/zoom-livetrak-l12-3.jpg'
  ],
  'behringer-xenyx-x1204usb': [
    '/images/products/behringer-xenyx-x1204usb/xenyx-x1204usb-1.jpg',
    '/images/products/behringer-xenyx-x1204usb/xenyx-x1204usb-2.jpg',
    '/images/products/behringer-xenyx-x1204usb/xenyx-x1204usb-3.jpg'
  ],
  'behringer-xenyx-q802usb': [
    '/images/products/behringer-xenyx-q802usb/xenyx-q802usb-1.jpg',
    '/images/products/behringer-xenyx-q802usb/xenyx-q802usb-2.jpg',
    '/images/products/behringer-xenyx-q802usb/xenyx-q802usb-3.jpg'
  ],
  'behringer-umc202hd': [
    '/images/products/behringer-umc202hd/umc202hd-1.jpg',
    '/images/products/behringer-umc202hd/umc202hd-2.jpg',
    '/images/products/behringer-umc202hd/umc202hd-3.jpg'
  ],
  'mackie-profx12v3': [
    '/images/products/mackie-profx12v3/profx12v3-1.jpg',
    '/images/products/mackie-profx12v3/profx12v3-2.jpg',
    '/images/products/mackie-profx12v3/profx12v3-3.jpg'
  ],
  'soundcraft-signature-12': [
    '/images/products/soundcraft-signature-12/signature-12-1.jpg',
    '/images/products/soundcraft-signature-12/signature-12-2.jpg',
    '/images/products/soundcraft-signature-12/signature-12-3.jpg'
  ],
  'midas-m32r-live': [
    '/images/products/midas-m32r-live/m32r-live-1.jpg',
    '/images/products/midas-m32r-live/m32r-live-2.jpg',
    '/images/products/midas-m32r-live/m32r-live-3.jpg'
  ],
  'tascam-model-12': [
    '/images/products/tascam-model-12/model-12-1.jpg',
    '/images/products/tascam-model-12/model-12-2.jpg',
    '/images/products/tascam-model-12/model-12-3.jpg'
  ],
  'roland-vr-4hd': [
    '/images/products/roland-vr-4hd/vr-4hd-1.jpg',
    '/images/products/roland-vr-4hd/vr-4hd-2.jpg',
    '/images/products/roland-vr-4hd/vr-4hd-3.jpg',
    '/images/products/roland-vr-4hd/vr-4hd-4.jpg'
  ],
  'soundcraft-signature-10': [
    '/images/products/soundcraft-signature-10/signature-10-1.jpg',
    '/images/products/soundcraft-signature-10/signature-10-2.jpg',
  ],
  'allen-heath-zed-10': [
    '/images/products/allen-heath-zed-10/zed-10-1.jpg',
    '/images/products/allen-heath-zed-10/zed-10-2.jpg',
    '/images/products/allen-heath-zed-10/zed-10-3.jpg'
  ],
  'presonus-studio-24c': [
    '/images/products/presonus-studio-24c/studio-24c-1.jpg',
    '/images/products/presonus-studio-24c/studio-24c-2.jpg',
    '/images/products/presonus-studio-24c/studio-24c-3.jpg'
  ],
  'presonus-studio-68c': [
    '/images/products/presonus-studio-68c/studio-68c-1.jpg',
    '/images/products/presonus-studio-68c/studio-68c-2.jpg',
    '/images/products/presonus-studio-68c/studio-68c-3.jpg'
  ],
  // Microphone Products
  'ptu-6000-8h': [
    '/images/products/ptu-6000-8h/ptu-6000-8h-1.jpg',
    '/images/products/ptu-6000-8h/ptu-6000-8h-2.jpg',
    '/images/products/ptu-6000-8h/ptu-6000-8h-3.jpg',
    '/images/products/ptu-6000-8h/ptu-6000-8h-4.jpg'
  ],
  'shure-blx288-pg58': [
    '/images/products/shure-blx288-pg58/shure-blx288-pg58-1.jpg',
    '/images/products/shure-blx288-pg58/shure-blx288-pg58-2.jpg',
    '/images/products/shure-blx288-pg58/shure-blx288-pg58-3.jpg',
    '/images/products/shure-blx288-pg58/shure-blx288-pg58-4.jpg',
    '/images/products/shure-blx288-pg58/shure-blx288-pg58-5.jpg'

  ],
  'vocopro-uhf-8800': [
    '/images/products/vocopro-uhf-8800/vocopro-uhf-8800-1.jpg',
  ],
  'drum-mic-kit': [
    '/images/products/drum-mic-kit/drum-mic-kit-1.jpg',
    '/images/products/drum-mic-kit/drum-mic-kit-2.jpg',
    '/images/products/drum-mic-kit/drum-mic-kit-3.jpg',
    '/images/products/drum-mic-kit/drum-mic-kit-4.jpg'
  ],
  'behringer-x32-compact': [
    '/images/products/behringer-x32-compact/behringer-x32-compact-1.jpg',
    '/images/products/behringer-x32-compact/behringer-x32-compact-2.jpg',
    '/images/products/behringer-x32-compact/behringer-x32-compact-3.jpg'
  ],
  'allen-heath-sq6': [
    '/images/products/allen-heath-sq6/allen-heath-sq6-1.jpg',
    '/images/products/allen-heath-sq6/allen-heath-sq6-2.jpg',
    '/images/products/allen-heath-sq6/allen-heath-sq6-3.jpg'
  ],
  'xlr-15ft': [
    '/images/products/xlr-cables/xlr-cable-1.jpg',
    '/images/products/xlr-cables/xlr-cable-2.jpg',
    '/images/products/xlr-cables/xlr-cable-3.jpg'
  ],
  'xlr-20ft': [
    '/images/products/xlr-cables/xlr-cable-1.jpg',
    '/images/products/xlr-cables/xlr-cable-2.jpg',
    '/images/products/xlr-cables/xlr-cable-3.jpg'
  ],
  'xlr-25ft': [
    '/images/products/xlr-cables/xlr-cable-1.jpg',
    '/images/products/xlr-cables/xlr-cable-2.jpg',
    '/images/products/xlr-cables/xlr-cable-3.jpg'
  ],
  'xlr-50ft': [
    '/images/products/xlr-cables/xlr-cable-1.jpg',
    '/images/products/xlr-cables/xlr-cable-2.jpg',
    '/images/products/xlr-cables/xlr-cable-3.jpg'
  ],
  'xlr-100ft': [
    '/images/products/xlr-cables/xlr-cable-1.jpg',
    '/images/products/xlr-cables/xlr-cable-2.jpg',
    '/images/products/xlr-cables/xlr-cable-3.jpg'
  ],
  'quarter-inch-15ft': [
    '/images/products/quarter-inch-cables/quarter-inch-cable-1.jpg',
    '/images/products/quarter-inch-cables/quarter-inch-cable-2.jpg',
  ],
  'quarter-inch-20ft': [
    '/images/products/quarter-inch-cables/quarter-inch-cable-1.jpg',
    '/images/products/quarter-inch-cables/quarter-inch-cable-2.jpg',
  ],
  'cat6-10ft': [
    '/images/products/cat6-cables/cat6-cable-1.jpg',
    '/images/products/cat6-cables/cat6-cable-2.jpg',
    '/images/products/cat6-cables/cat6-cable-3.jpg'
  ],
  'cat6-50ft': [
    '/images/products/cat6-cables/cat6-cable-1.jpg',
    '/images/products/cat6-cables/cat6-cable-2.jpg',
    '/images/products/cat6-cables/cat6-cable-3.jpg'
  ],
  'cat6-100ft': [
    '/images/products/cat6-cables/cat6-cable-1.jpg',
    '/images/products/cat6-cables/cat6-cable-2.jpg',
    '/images/products/cat6-cables/cat6-cable-3.jpg'
  ],
  'ac-power-cable': [
    '/images/products/ac-power-cables/ac-power-cable-1.jpg',
    '/images/products/ac-power-cables/ac-power-cable-2.jpg',
    '/images/products/ac-power-cables/ac-power-cable-3.jpg'
  ],
  'qsc-k12-2': [
    '/images/products/qsc-k12-2/qsc-k12-2-1.jpg',
    '/images/products/qsc-k12-2/qsc-k12-2-2.jpg',
    '/images/products/qsc-k12-2/qsc-k12-2-3.jpg'
  ],
  'rsg15-speaker-system': [
    '/images/products/rsg15-speaker-system/rsg15-speaker-system-1.jpg',
    '/images/products/rsg15-speaker-system/rsg15-speaker-system-2.jpg',
    '/images/products/rsg15-speaker-system/rsg15-speaker-system-3.jpg'
  ],
  'jbl-eon715-system': [
    '/images/products/jbl-eon715-system/jbl-eon715-1.jpg',
    '/images/products/jbl-eon715-system/jbl-eon715-2.jpg',
    '/images/products/jbl-eon715-system/jbl-eon715-3.jpg'
  ],
  'mackie-thump215-system': [
    '/images/products/mackie-thump215-system/mackie-thump215-1.jpg',
    '/images/products/mackie-thump215-system/mackie-thump215-2.jpg',
    '/images/products/mackie-thump215-system/mackie-thump215-3.jpg',
    '/images/products/mackie-thump215-system/mackie-thump215-4.jpg',
    '/images/products/mackie-thump215-system/mackie-thump215-5.jpg'
  ],
  'ss7761b-speaker-stand': [
    '/images/products/ss7761b-speaker-stand/ss7761b-1.jpg',
    '/images/products/ss7761b-speaker-stand/ss7761b-2.jpg',
    '/images/products/ss7761b-speaker-stand/ss7761b-3.jpg'
  ],
  'ms7701b-mic-stand': [
    '/images/products/ms7701b-mic-stand/ms7701b-1.jpg',
    '/images/products/ms7701b-mic-stand/ms7701b-2.jpg',
    '/images/products/ms7701b-mic-stand/ms7701b-3.jpg'
  ],
  'kick-drum-mic-stand': [
    '/images/products/kick-drum-mic-stand/kick-drum-mic-1.jpg',
    '/images/products/kick-drum-mic-stand/kick-drum-mic-2.jpg',
    '/images/products/kick-drum-mic-stand/kick-drum-mic-3.jpg'
  ],
  'snake-8ch-50ft': [
    '/images/products/snake-8ch-50ft/snake-8ch-50ft-1.jpg',
    '/images/products/snake-8ch-50ft/snake-8ch-50ft-2.jpg',
    '/images/products/snake-8ch-50ft/snake-8ch-50ft-3.jpg'
  ],
  'snake-16ch-100ft': [
    '/images/products/snake-16ch-100ft/snake-16ch-100ft-1.jpg',
    '/images/products/snake-16ch-100ft/snake-16ch-100ft-2.jpg',
    '/images/products/snake-16ch-100ft/snake-16ch-100ft-3.jpg'
  ],
  'snake-24ch-100ft': [
    '/images/products/snake-24ch-100ft/snake-24ch-100ft-1.jpg',
    '/images/products/snake-24ch-100ft/snake-24ch-100ft-2.jpg',
    '/images/products/snake-24ch-100ft/snake-24ch-100ft-3.jpg'
  ],
  'snake-32ch-100ft': [
    '/images/products/snake-32ch-100ft/snake-32ch-100ft-1.jpg',
    '/images/products/snake-32ch-100ft/snake-32ch-100ft-2.jpg',
    '/images/products/snake-32ch-100ft/snake-32ch-100ft-3.jpg'
  ],
  'behringer-powerplay-p16m': [
    '/images/products/behringer-powerplay-p16m/behringer-powerplay-p16m-1.jpg',
  ],
  'behringer-powerplay-p16i': [
    '/images/products/behringer-powerplay-p16i/behringer-powerplay-p16i-1.jpg',
    '/images/products/behringer-powerplay-p16i/behringer-powerplay-p16i-2.jpg',
    '/images/products/behringer-powerplay-p16i/behringer-powerplay-p16i-3.jpg'
  ],
  'behringer-powerplay-p16d': [
    '/images/products/behringer-powerplay-p16d/behringer-powerplay-p16d-1.jpg',
    '/images/products/behringer-powerplay-p16d/behringer-powerplay-p16d-2.jpg',
    '/images/products/behringer-powerplay-p16d/behringer-powerplay-p16d-3.jpg'
  ],
  'iem-headphones': [
    '/images/products/iem-headphones/iem-headphones-1.jpg',
    '/images/products/iem-headphones/iem-headphones-2.jpg',
    '/images/products/iem-headphones/iem-headphones-3.jpg'
  ],
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  features?: string[];
  technical_details?: Record<string, string>;
  included_items?: string[];
  warranty_info?: string;
  installation_available?: boolean;
  our_price?: number;
  images?: { image_url: string }[];
}

interface BundleItem extends Product {
  quantity: number;
}

interface CardQuantityState {
  [key: string]: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.4
    }
  }
}

const titleToKeyMap: Record<string, string> = {
    'PTU-6000-8H 8-Channel UHF Wireless Microphone System': 'ptu-6000-8h',
    'Shure BLX288/PG58 Dual Wireless Microphone System': 'shure-blx288-pg58',
    'VocoPro UHF-8800 Professional 8-Channel Wireless System': 'vocopro-uhf-8800',
    'Drum Microphone Kit - 7-Piece Professional Set': 'drum-mic-kit',
    'Behringer X32 Compact Digital Mixer': 'behringer-x32-compact',
    'Allen & Heath SQ-6 48-channel Digital Mixer': 'allen-heath-sq6',
    'Yamaha MGP32X 32-channel Mixer with Effects': 'yamaha-mgp32x',
    'XLR Cable - 15ft Professional Microphone Cable': 'xlr-15ft',
    'XLR Cable - 20ft Professional Microphone Cable': 'xlr-20ft',
    'XLR Cable - 25ft Professional Microphone Cable': 'xlr-25ft',
    'XLR Cable - 50ft Professional Microphone Cable': 'xlr-50ft',
    'XLR Cable - 100ft Professional Microphone Cable': 'xlr-100ft',
    'Quarter Inch Cable - 15ft Professional Instrument Cable': 'quarter-inch-15ft',
    'Quarter Inch Cable - 20ft Professional Instrument Cable': 'quarter-inch-20ft',
    'Cat6 Cable - 10ft Professional Network Cable': 'cat6-10ft',
    'Cat6 Cable - 50ft Professional Network Cable': 'cat6-50ft',
    'Cat6 Cable - 100ft Professional Network Cable': 'cat6-100ft',
    'AC Power Cable - Professional Grade IEC Power Cord': 'ac-power-cable',
    'QSC K12.2 12" 2000W Powered Speaker': 'qsc-k12-2',
    'RSG15 15" 3000W Passive Speaker System': 'rsg15-speaker-system',
    'JBL EON715 15" & EON718S 18" Powered Speaker System': 'jbl-eon715-system',
    'Mackie THUMP215 15" & THUMP118S 18" Powered System': 'mackie-thump215-system',
    'On Stage SS7761B Pro Speaker Stand': 'ss7761b-speaker-stand',
    'On Stage MS7701B Telescoping Boom Stand': 'ms7701b-mic-stand',
    'Kick Drum Microphone Stand': 'kick-drum-mic-stand',
    'On Stage MS7701B Microphone Boom Stand': 'ms7701b-mic-stand',
    'On Stage SS7761B All-Aluminum Speaker Stand': 'ss7761b-speaker-stand',
    'Allen & Heath DX168 Digital Snake': 'allen-heath-dx168',
    'Midas DL16/DL32 Digital Stage Box': 'midas-dl16-dl32',
    'ProCo StageMASTER 32/4 Analog Snake': 'proco-stagemaster-32-4',
    'Hosa HSS-005X 32-Channel Snake': 'hosa-hss-005x',
    'Behringer S32 Digital Snake': 'behringer-s32',
    'Whirlwind M-32/4 Analog Snake': 'whirlwind-m-32-4',
    'Allen & Heath AB168 Digital Snake': 'allen-heath-ab168',
    'Behringer Powerplay P16-M 16-Channel Digital Personal Mixer': 'behringer-powerplay-p16m',
    'Behringer Powerplay P16-I 16-channel Input Module': 'behringer-powerplay-p16i',
    'Behringer Powerplay P16-D 16-channel Distribution Module': 'behringer-powerplay-p16d',
    'In-Ear Monitors (IEM)': 'iem-headphones'
  };

const getProductImageKey = (title: string): string => {
  const titleToKeyMap: Record<string, string> = {
    'PTU-6000-8H 8-Channel UHF Wireless Microphone System': 'ptu-6000-8h',
    'Shure BLX288/PG58 Dual Wireless Microphone System': 'shure-blx288-pg58',
    'VocoPro UHF-8800 Professional 8-Channel Wireless System': 'vocopro-uhf-8800',
    'Drum Microphone Kit - 7-Piece Professional Set': 'drum-mic-kit',
    'Behringer X32 Compact Digital Mixer': 'behringer-x32-compact',
    'Allen & Heath SQ-6 48-channel Digital Mixer': 'allen-heath-sq6',
    'Yamaha MGP32X 32-channel Mixer with Effects': 'yamaha-mgp32x',
    'XLR Cable - 15ft Professional Microphone Cable': 'xlr-15ft',
    'XLR Cable - 20ft Professional Microphone Cable': 'xlr-20ft',
    'XLR Cable - 25ft Professional Microphone Cable': 'xlr-25ft',
    'XLR Cable - 50ft Professional Microphone Cable': 'xlr-50ft',
    'XLR Cable - 100ft Professional Microphone Cable': 'xlr-100ft',
    'Quarter Inch Cable - 15ft Professional Instrument Cable': 'quarter-inch-15ft',
    'Quarter Inch Cable - 20ft Professional Instrument Cable': 'quarter-inch-20ft',
    'Cat6 Cable - 10ft Professional Network Cable': 'cat6-10ft',
    'Cat6 Cable - 50ft Professional Network Cable': 'cat6-50ft',
    'Cat6 Cable - 100ft Professional Network Cable': 'cat6-100ft',
    'AC Power Cable - Professional Grade IEC Power Cord': 'ac-power-cable',
    'QSC K12.2 12" 2000W Powered Speaker': 'qsc-k12-2',
    'RSG15 15" 3000W Passive Speaker System': 'rsg15-speaker-system',
    'JBL EON715 15" & EON718S 18" Powered Speaker System': 'jbl-eon715-system',
    'Mackie THUMP215 15" & THUMP118S 18" Powered System': 'mackie-thump215-system',
    'On Stage SS7761B Pro Speaker Stand': 'ss7761b-speaker-stand',
    'On Stage MS7701B Telescoping Boom Stand': 'ms7701b-mic-stand',
    'Kick Drum Microphone Stand': 'kick-drum-mic-stand',
    'On Stage MS7701B Microphone Boom Stand': 'ms7701b-mic-stand',
    'On Stage SS7761B All-Aluminum Speaker Stand': 'ss7761b-speaker-stand',
    'Allen & Heath DX168 Digital Snake': 'allen-heath-dx168',
    'Midas DL16/DL32 Digital Stage Box': 'midas-dl16-dl32',
    'ProCo StageMASTER 32/4 Analog Snake': 'proco-stagemaster-32-4',
    'Hosa HSS-005X 32-Channel Snake': 'hosa-hss-005x',
    'Behringer S32 Digital Snake': 'behringer-s32',
    'Whirlwind M-32/4 Analog Snake': 'whirlwind-m-32-4',
    'Allen & Heath AB168 Digital Snake': 'allen-heath-ab168',
    'Behringer Powerplay P16-M 16-Channel Digital Personal Mixer': 'behringer-powerplay-p16m',
    'Behringer Powerplay P16-I 16-channel Input Module': 'behringer-powerplay-p16i',
    'Behringer Powerplay P16-D 16-channel Distribution Module': 'behringer-powerplay-p16d',
    'In-Ear Monitors (IEM)': 'iem-headphones'
  };

  return titleToKeyMap[title] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const TAX_RATE = 0.0775 // 7.75% for Riverside, CA

const calculateTax = (price: number): number => {
  return price * TAX_RATE
}

const calculateTotalWithTax = (price: number): number => {
  return price * (1 + TAX_RATE)
}

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [installationSelected, setInstallationSelected] = useState(false)
  const [installationPrice, setInstallationPrice] = useState(0)
  const [cartWidth, setCartWidth] = useState(384)
  const [isCreatingContract, setIsCreatingContract] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [quoteEmail, setQuoteEmail] = useState('')
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [showQuoteSuccess, setShowQuoteSuccess] = useState(false)
  const [showQuoteError, setShowQuoteError] = useState(false)
  const [quoteErrorMessage, setQuoteErrorMessage] = useState('')
  const productsPerPage = isCartOpen ? 8 : 10 // Adjust based on cart state
  const [cardQuantities, setCardQuantities] = useState<CardQuantityState>({})
  const [isListView, setIsListView] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        console.log('Product data:', data)
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products
    .sort((a, b) => {
      // First sort by main category
      const categoryOrder = {
        'Audio Gear/Mixers': 1,
        'Audio Gear/Mics': 2,
        'Audio Gear/Stands': 3,
        'Audio Gear/Cables': 4,
        'Audio Gear/Snakes': 5,
        'Audio Gear/Speakers': 6,
        'Audio Gear/IEMS': 7,
        'Streaming Gear': 8,
        'Services': 9
      };
      
      const categoryA = categoryOrder[a.category as keyof typeof categoryOrder] || 10;
      const categoryB = categoryOrder[b.category as keyof typeof categoryOrder] || 10;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      // For cables, sort by type and then by length
      if (a.category === 'Audio Gear/Cables' && b.category === 'Audio Gear/Cables') {
        const cableOrder = {
          'XLR': 1,
          'Quarter Inch': 2,
          'Cat6': 3,
          'AC Power': 4
        };
        
        const getCableType = (title: string) => {
          if (title.includes('XLR')) return 'XLR';
          if (title.includes('Quarter Inch')) return 'Quarter Inch';
          if (title.includes('Cat6')) return 'Cat6';
          if (title.includes('Power')) return 'AC Power';
          return '';
        };
        
        const typeA = cableOrder[getCableType(a.title) as keyof typeof cableOrder] || 5;
        const typeB = cableOrder[getCableType(b.title) as keyof typeof cableOrder] || 5;
        
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        
        // Sort by length (extract numbers from title)
        const getLengthNumber = (title: string) => {
          const match = title.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        
        return getLengthNumber(a.title) - getLengthNumber(b.title);
      }
      
      // For other categories, sort by price
      return (a.our_price || a.price) - (b.our_price || b.price);
    })
    .filter(p => filterByCategory(p, selectedCategory))
    .filter(p => 
      searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProductClick = (product: Product) => {
    const key = getProductImageKey(product.title);
    const images = productImages[key as keyof typeof productImages];
    
    const productWithImages = {
      ...product,
      images: images?.map(url => ({ image_url: url })) || []
    };
    
    setSelectedProduct(productWithImages);
    setIsModalOpen(true);
  }

  const handleCardQuantityChange = (productId: string, amount: number) => {
    setCardQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + amount)
    }))
  }

  const addToBundle = (product: Product) => {
    const quantity = cardQuantities[product.id] || 1
    if (!bundleItems.find(item => item.id === product.id)) {
      const bundleItem: BundleItem = { ...product, quantity }
      setBundleItems([...bundleItems, bundleItem])
    // Open the cart when adding a product
    setIsCartOpen(true)
    }
    // Reset quantity after adding to bundle
    setCardQuantities(prev => ({ ...prev, [product.id]: 1 }))
  }

  const removeFromBundle = (productId: string) => {
    setBundleItems(prev => {
      const newItems = prev.filter(item => item.id !== productId)
      if (newItems.length === 0) {
        setIsCartOpen(false)
      }
      return newItems
    })
  }

  const handleBundleQuantityUpdate = (productId: string, newQuantity: number) => {
    setBundleItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const handleContractCreation = async (formData: CheckoutFormData) => {
    setIsCreatingContract(true) // Show loading immediately
    setIsCheckoutOpen(false) // Close checkout modal immediately
    
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          products: bundleItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            title: item.title,
            price: item.our_price || item.price
          })),
          installationPrice: installationSelected ? installationPrice : 0
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowSuccessNotification(true)
        setTimeout(() => {
          setShowSuccessNotification(false)
          setBundleItems([])
          setIsCartOpen(false)
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to create contract')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      throw error // Re-throw the error to be handled by the Checkout component
    } finally {
      setIsCreatingContract(false)
    }
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    
    const startX = e.pageX
    const startWidth = cartWidth
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(384, Math.min(800, startWidth + (startX - e.pageX)))
      setCartWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleQuoteCreation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingQuote(true)
    
    try {
      if (!bundleItems.length) {
        throw new Error('Please add items to your quote')
      }

      const subtotal = bundleItems.reduce((sum, product) => 
        sum + (product.our_price || product.price) * product.quantity, 0
      );

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: quoteEmail,
          products: bundleItems.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: Number(item.our_price || item.price)
          })),
          subtotal,
          totalAmount: subtotal + calculateTax(subtotal) + (installationSelected ? installationPrice : 0),
          installationPrice: installationSelected ? installationPrice : 0,
          taxAmount: calculateTax(subtotal)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create quote')
      }

      const data = await response.json()
      setShowQuoteSuccess(true)
      setIsQuoteModalOpen(false)
      setQuoteEmail('')
      setTimeout(() => {
        setShowQuoteSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error creating quote:', error)
      alert(error instanceof Error ? error.message : 'Failed to create quote. Please try again.')
    } finally {
      setIsCreatingQuote(false)
    }
  }

  // Early return while not mounted to prevent hydration mismatch
  if (!mounted) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Navigation Bar */}
      <div className={cn(
        "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
      )}>
        <div className="max-w-[2000px] mx-auto">
          {/* Main Header */}
          <div className="h-16 flex items-center">
            {/* Left side - Search */}
            <div className="w-[320px] relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 h-9 bg-gray-50/80 border-0 ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 rounded-none"
              />
            </div>

            {/* Center - Categories */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center bg-gray-100/50 rounded-lg p-1">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "h-8 text-sm font-medium rounded-md transition-all duration-200",
                    selectedCategory === 'all' 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  )}
                >
                  All
                </Button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <Button
                  variant={selectedCategory === 'Audio Gear' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Audio Gear')}
                  className={cn(
                    "h-8 text-sm font-medium rounded-md transition-all duration-200",
                    selectedCategory === 'Audio Gear' 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  )}
                >
                  Audio Gear
                </Button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <Button
                  variant={selectedCategory === 'Streaming Gear' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Streaming Gear')}
                  className={cn(
                    "h-8 text-sm font-medium rounded-md transition-all duration-200",
                    selectedCategory === 'Streaming Gear' 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  )}
                >
                  Streaming Gear
                </Button>
                <div className="h-4 w-px bg-gray-200 mx-1" />
                <Button
                  variant={selectedCategory === 'Services' ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory('Services')}
                  className={cn(
                    "h-8 text-sm font-medium rounded-md transition-all duration-200",
                    selectedCategory === 'Services' 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  )}
                >
                  Services
                </Button>
              </div>
            </div>

            {/* Right side - View options and Bundle */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsListView(!isListView)}
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
              >
                {isListView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button
                variant="default"
                onClick={toggleCart}
                className="h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                View Bundle
                {bundleItems.length > 0 && (
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    {bundleItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Persistent Cart */}
      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* Products Section - Make this section scrollable */}
        <div className={cn(
          "flex-1 overflow-y-auto transition-all duration-200",
          isCartOpen ? "mr-[384px]" : "mr-0"
        )}>
          {/* Subcategories Bar - Moved here */}
          {selectedCategory.startsWith('Audio Gear') && (
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center -mb-px overflow-x-auto scrollbar-hide py-2">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCategory('Audio Gear')}
                    className={cn(
                      "px-4 h-9 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                      selectedCategory === 'Audio Gear'
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
                    )}
                  >
                    All Audio
                  </Button>
                  {CATEGORIES['Audio Gear'].subcategories.map((subcat) => (
                    <Button
                      key={subcat.path}
                      variant="ghost"
                      onClick={() => setSelectedCategory(subcat.path)}
                      className={cn(
                        "px-4 h-9 text-sm font-medium rounded-lg transition-all whitespace-nowrap ml-2",
                        selectedCategory === subcat.path 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
                      )}
                    >
                      {subcat.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8 px-8 pt-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
              <p className="mt-1 text-sm text-gray-500">
                Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
              </p>
              </div>
            </div>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </motion.div>
          )}

          {/* Product Grid/List View */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={cn(
              isListView 
                ? "flex flex-col gap-4 px-8"
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-8",
              isCartOpen && "lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {currentProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className={cn(
                  "group relative bg-white rounded-lg border border-gray-200 hover:border-blue-500/20 hover:shadow-lg transition-all duration-300",
                  isListView ? "flex gap-4 p-4" : ""
                )}
              >
                <div 
                  className={cn(
                    "relative bg-white overflow-hidden cursor-pointer rounded-lg",
                    isListView ? "h-24 w-24 flex-shrink-0" : "aspect-square"
                  )}
                  onClick={() => handleProductClick(product)}
                >
                  {(() => {
                    const key = getProductImageKey(product.title);
                    const images = productImages[key as keyof typeof productImages];
                    if (images && images.length > 0) {
                      return (
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                          <Image
                            src={images[0]}
                            alt={product.title}
                            fill
                            className="object-contain p-2"
                            sizes="80px"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    );
                  })()}
                </div>

                <div className={cn(
                  isListView ? "flex-1 py-1" : "p-4"
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 
                      className={cn(
                        "font-medium text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer",
                        isListView ? "text-sm line-clamp-1" : "text-base line-clamp-2"
                      )}
                      onClick={() => handleProductClick(product)}
                    >
                      {product.title}
                    </h3>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-semibold text-blue-600 whitespace-nowrap",
                        isListView ? "text-sm" : "text-base"
                      )}>
                        ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        + ${calculateTax(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tax
                      </span>
                    </div>
                  </div>
                  
                  {!isListView && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {!isListView && product.features && product.features.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Key Features</h4>
                      <ul className="space-y-1.5">
                        {product.features.slice(0, 2).map((feature, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center">
                            <span className="w-1 h-1 rounded-full bg-blue-600/80 mr-1.5 flex-shrink-0" />
                            <span className="line-clamp-1">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {product.features.length > 2 && (
                        <button 
                          onClick={() => handleProductClick(product)}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1 group/btn"
                        >
                          +{product.features.length - 2} more features
                          <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    isListView 
                      ? "flex items-center justify-between mt-2" 
                      : "mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"
                  )}>
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-100">
                      {product.category.split('/')[1] || product.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardQuantityChange(product.id, -1);
                          }}
                          disabled={!cardQuantities[product.id] || cardQuantities[product.id] <= 1}
                          className="h-6 w-6"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {cardQuantities[product.id] || 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardQuantityChange(product.id, 1);
                          }}
                          className="h-6 w-6"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToBundle(product);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium"
                        disabled={bundleItems.some(item => item.id === product.id)}
                      >
                        {bundleItems.some(item => item.id === product.id) ? (
                          'Added'
              ) : (
                          <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="mt-8 mb-6">
            <div className="flex justify-center items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 transition-all hover:scale-105 hover:border-blue-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 w-9 transition-all",
                    currentPage === page 
                      ? "bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 text-white" 
                      : "hover:border-blue-400 hover:scale-105 text-gray-600"
                  )}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 transition-all hover:scale-105 hover:border-blue-400"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Persistent Cart Section */}
        <AnimatePresence mode="popLayout">
          {isCartOpen && (
            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="fixed right-0 top-0 bottom-0 w-[384px] border-l border-gray-200 bg-white shadow-xl"
              style={{ marginTop: "65px" }}
            >
              {/* Resize Handle */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/10 group"
                onMouseDown={handleResize}
                style={{ touchAction: 'none' }}
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-200 group-hover:bg-blue-500/50 transition-colors" />
              </div>

              <div className="flex-1 flex flex-col">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ 
                    duration: 0.3,
                    delay: 0.1,
                    ease: "easeOut"
                  }}
                  className="flex flex-col h-full p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Your Bundle</h2>
                      <p className="text-sm text-gray-500">
                        {bundleItems.reduce((sum, product) => sum + product.quantity, 0)} items in your bundle
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCartOpen(false)}
                      className="h-8 w-8 rounded-full hover:bg-gray-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2">
                    {bundleItems.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex flex-col bg-white rounded-lg p-4"
                      >
                        {/* Product Image and Basic Info */}
                        <div className="flex gap-4 mb-3">
                          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200">
                            {(() => {
                              const key = getProductImageKey(product.title);
                              const images = productImages[key as keyof typeof productImages];
                              if (images && images.length > 0) {
                                return (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white">
                                    <Image
                                      src={images[0]}
                                      alt={product.title}
                                      fill
                                      className="object-contain p-2"
                                      sizes="80px"
                                    />
                                  </div>
                                );
                              }
                              return (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 break-words">
                              {product.title}
                            </h4>
                            <div className="mt-1 text-sm font-medium text-blue-600">
                              ${(product.our_price || product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls and Remove */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBundleQuantityUpdate(product.id, product.quantity - 1);
                              }}
                              disabled={product.quantity <= 1}
                              className="h-7 w-7"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center text-sm">
                              {product.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBundleQuantityUpdate(product.id, product.quantity + 1);
                              }}
                              className="h-7 w-7"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromBundle(product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-base font-medium text-gray-900">Subtotal</span>
                        <p className="text-sm text-gray-500 mt-0.5">Tax will be added to the final contract</p>
                      </div>
                      <span className="text-lg font-semibold text-blue-600">
                        ${bundleItems.reduce((sum, product) => 
                          sum + (product.our_price || product.price) * product.quantity, 0
                        ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Installation Option */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={installationSelected}
                            onChange={(e) => setInstallationSelected(e.target.checked)}
                          />
                          <span className="text-sm font-medium text-gray-900">Add Installation Service</span>
                        </label>
                      </div>
                      {installationSelected && (
                        <div className="mt-2">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input
                              type="number"
                              value={installationPrice}
                              onChange={(e) => setInstallationPrice(parseFloat(e.target.value) || 0)}
                              className="pl-7"
                              placeholder="Enter installation price"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Enter the installation service price</p>
                </div>
              )}
            </div>

                    {/* Total with Installation */}
                    <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
                      <span className="text-base font-medium text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ${(bundleItems.reduce((sum, product) => 
                          sum + (product.our_price || product.price) * product.quantity, 0
                        ) + (installationSelected ? installationPrice : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
          </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setIsQuoteModalOpen(true)}
                      >
                        Create Quote
                      </Button>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                        onClick={() => setIsCheckoutOpen(true)}
                      >
                        Create Contract
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                      <p className="text-xs text-center text-gray-500">
                        By creating a contract, you agree to our terms of service and rental agreement.
                      </p>
        </div>
      </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Notifications */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-0 bottom-4 mx-auto w-fit z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-gray-900">Contract created successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isCreatingContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Creating your contract...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout
            products={bundleItems.map(item => ({
              ...item,
              id: Number(item.id)
            }))}
            onClose={() => setIsCheckoutOpen(false)}
            onSubmit={handleContractCreation}
            installationPrice={installationSelected ? installationPrice : 0}
          />
        )}
      </AnimatePresence>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProduct(null)
          }}
          onAddToBundle={(product) => addToBundle({...product, price: Number(product.price)})}
          selectedProduct={{
            ...selectedProduct,
            images: (() => {
              const key = getProductImageKey(selectedProduct.title);
              const images = productImages[key as keyof typeof productImages];
              return images?.map(url => ({ image_url: url })) || [];
            })()
          }}
        />
      )}

      {/* Quote Modal */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-md border border-white/20 shadow-xl">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <DialogTitle className="text-2xl font-semibold">Create Quote</DialogTitle>
            <p className="text-sm text-gray-500">
              We'll send a detailed quote with product images and specifications to your email.
            </p>
          </DialogHeader>
          <form onSubmit={handleQuoteCreation} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={quoteEmail}
                  onChange={(e) => setQuoteEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 bg-white/50"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="bg-white/50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items in Quote:</span>
                  <span className="font-medium">{bundleItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ${(bundleItems.reduce((sum, product) => 
                      sum + (product.our_price || product.price) * product.quantity, 0
                    )).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sales Tax:</span>
                  <span className="font-medium">
                    ${calculateTax(bundleItems.reduce((sum, product) => 
                      sum + (product.our_price || product.price) * product.quantity, 0
                    )).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {installationSelected && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Installation:</span>
                    <span className="font-medium">
                      ${installationPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    ${(bundleItems.reduce((sum, product) => 
                      sum + (product.our_price || product.price) * product.quantity, 0
                    ) + (installationSelected ? installationPrice : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base"
                disabled={isCreatingQuote}
              >
                {isCreatingQuote ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Quote...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Send Quote</span>
                  </div>
                )}
              </Button>
              <p className="mt-3 text-xs text-center text-gray-500">
                The quote will be valid for 30 days from the date of creation.
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quote Success/Error Notification */}
      <AnimatePresence>
        {(showQuoteSuccess || showQuoteError) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-0 bottom-4 mx-auto w-fit z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3"
          >
            {showQuoteSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Quote sent successfully!</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-gray-900">{quoteErrorMessage}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 