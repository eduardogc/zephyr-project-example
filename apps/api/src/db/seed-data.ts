import type { Product } from '@shop/types';

export const SEED_PRODUCTS: Product[] = [
  { id: 'aero-buds', name: 'Aero Buds Pro', description: 'Active noise cancelling earbuds with 30h battery life and spatial audio.', category: 'audio', priceCents: 12900, rating: 4.7, stock: 24, emoji: '🎧', hue: 215 },
  { id: 'studio-cans', name: 'Studio Cans', description: 'Over-ear reference headphones with a flat, honest response.', category: 'audio', priceCents: 19900, rating: 4.8, stock: 9, emoji: '🎼', hue: 265 },
  { id: 'pocket-speaker', name: 'Pocket Speaker', description: 'Waterproof Bluetooth speaker that fits in a jacket pocket.', category: 'audio', priceCents: 5900, rating: 4.3, stock: 60, emoji: '🔊', hue: 190 },
  { id: 'pulse-watch', name: 'Pulse Watch 3', description: 'Fitness tracking, sleep scores and a 10-day battery.', category: 'wearables', priceCents: 24900, rating: 4.5, stock: 15, emoji: '⌚', hue: 150 },
  { id: 'loop-band', name: 'Loop Band', description: 'Minimal screenless activity band. Charge it once a month.', category: 'wearables', priceCents: 7900, rating: 4.1, stock: 40, emoji: '📿', hue: 30 },
  { id: 'vision-glasses', name: 'Vision Glasses', description: 'Lightweight smart glasses with open-ear audio.', category: 'wearables', priceCents: 29900, rating: 3.9, stock: 5, emoji: '🕶️', hue: 340 },
  { id: 'glow-lamp', name: 'Glow Lamp', description: 'Tunable white and colour desk lamp with scheduling.', category: 'home', priceCents: 6900, rating: 4.6, stock: 33, emoji: '💡', hue: 50 },
  { id: 'air-purifier', name: 'Breeze Purifier', description: 'Quiet HEPA purifier for rooms up to 40 m².', category: 'home', priceCents: 14900, rating: 4.4, stock: 12, emoji: '🌬️', hue: 175 },
  { id: 'smart-plug', name: 'Smart Plug 4-pack', description: 'Matter-compatible plugs with energy monitoring.', category: 'home', priceCents: 3900, rating: 4.2, stock: 100, emoji: '🔌', hue: 100 },
  { id: 'desk-mat', name: 'Felt Desk Mat', description: 'Wool felt mat that keeps cables and coffee in check.', category: 'accessories', priceCents: 3500, rating: 4.6, stock: 80, emoji: '🟫', hue: 20 },
  { id: 'usbc-hub', name: 'USB-C Hub 8-in-1', description: 'HDMI 4K, SD, Ethernet and 100W pass-through charging.', category: 'accessories', priceCents: 5500, rating: 4.0, stock: 0, emoji: '🔗', hue: 240 },
  { id: 'travel-case', name: 'Travel Case', description: 'Hard-shell organiser for earbuds, cables and chargers.', category: 'accessories', priceCents: 2500, rating: 4.3, stock: 70, emoji: '🧳', hue: 300 },
];
