// 640px Unsplash thumbnails (free licence), keyed by product id. Imported only through
// `@shop/ui/product-photo`, so only apps that show product photos bundle (and serve) them.
import aeroBuds from './aero-buds.jpg';
import studioCans from './studio-cans.jpg';
import pocketSpeaker from './pocket-speaker.jpg';
import pulseWatch from './pulse-watch.jpg';
import loopBand from './loop-band.jpg';
import visionGlasses from './vision-glasses.jpg';
import glowLamp from './glow-lamp.jpg';
import airPurifier from './air-purifier.jpg';
import smartPlug from './smart-plug.jpg';
import deskMat from './desk-mat.jpg';
import usbcHub from './usbc-hub.jpg';
import travelCase from './travel-case.jpg';

export const THUMBS: Record<string, string> = {
  'aero-buds': aeroBuds,
  'studio-cans': studioCans,
  'pocket-speaker': pocketSpeaker,
  'pulse-watch': pulseWatch,
  'loop-band': loopBand,
  'vision-glasses': visionGlasses,
  'glow-lamp': glowLamp,
  'air-purifier': airPurifier,
  'smart-plug': smartPlug,
  'desk-mat': deskMat,
  'usbc-hub': usbcHub,
  'travel-case': travelCase,
};
