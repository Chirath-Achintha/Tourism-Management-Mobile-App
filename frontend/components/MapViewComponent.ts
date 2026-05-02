// This module exports MapView components conditionally based on platform
// On web: returns null (web fallback is handled in component)
// On native: returns actual react-native-maps components

import { Platform } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

export { MapView, Marker, PROVIDER_GOOGLE };
