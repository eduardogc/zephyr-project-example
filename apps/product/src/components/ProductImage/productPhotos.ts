// Real photos from Unsplash (free licence). They are bundled with this remote, so Zephyr serves them
// from its edge together with the remote's JS (assetPrefix: 'auto' -> the remote's own Zephyr URL).
import aeroBuds from '../../assets/products/aero-buds.jpg';
import studioCans from '../../assets/products/studio-cans.jpg';
import pocketSpeaker from '../../assets/products/pocket-speaker.jpg';
import pulseWatch from '../../assets/products/pulse-watch.jpg';
import loopBand from '../../assets/products/loop-band.jpg';
import visionGlasses from '../../assets/products/vision-glasses.jpg';
import glowLamp from '../../assets/products/glow-lamp.jpg';
import airPurifier from '../../assets/products/air-purifier.jpg';
import smartPlug from '../../assets/products/smart-plug.jpg';
import deskMat from '../../assets/products/desk-mat.jpg';
import usbcHub from '../../assets/products/usbc-hub.jpg';
import travelCase from '../../assets/products/travel-case.jpg';

export type ProductPhoto = { src: string; photographer: string; unsplashId: string };

export const PRODUCT_PHOTOS: Record<string, ProductPhoto> = {
  'aero-buds': { src: aeroBuds, photographer: 'Daniel Romero', unsplashId: 'AgLMrojqjAM' },
  'studio-cans': { src: studioCans, photographer: 'C D-X', unsplashId: 'PDX_a_82obo' },
  'pocket-speaker': { src: pocketSpeaker, photographer: 'Nejc Soklič', unsplashId: 'g5Y5kjOwGwQ' },
  'pulse-watch': { src: pulseWatch, photographer: 'Simon Daoudi', unsplashId: '2wFoa040m8g' },
  'loop-band': { src: loopBand, photographer: 'Nikita Kostrykin', unsplashId: '5--lSW0MiE0' },
  'vision-glasses': { src: visionGlasses, photographer: 'Giorgio Trovato', unsplashId: 'K62u25Jk6vo' },
  'glow-lamp': { src: glowLamp, photographer: 'Andrej Lišakov', unsplashId: '3A4XZUopCJA' },
  'air-purifier': { src: airPurifier, photographer: 'VBreathe', unsplashId: 'M4OilrUTWyc' },
  'smart-plug': { src: smartPlug, photographer: 'Kelly Sikkema', unsplashId: 'fZirmwarM0E' },
  'desk-mat': { src: deskMat, photographer: 'Oakywood', unsplashId: 'Zah7GC6mNKg' },
  'usbc-hub': { src: usbcHub, photographer: 'Gavin Phillips', unsplashId: 'OaNfWxDJ4AI' },
  'travel-case': { src: travelCase, photographer: 'Paige Cody', unsplashId: 'bduz2R3S1lM' },
};
