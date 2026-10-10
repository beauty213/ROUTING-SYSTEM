/**
 * googleMapsService.js
 * Utility service to load and interact with Google Maps JavaScript API,
 * TrafficLayer, and DirectionsService for Hyderabad, Telangana, India.
 */

const STORAGE_KEY = 'hyd_google_maps_api_key';

export class GoogleMapsService {
  /**
   * Retrieves the configured Google Maps API key from localStorage or Vite environment.
   */
  static getApiKey() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Saves the user-provided Google Maps API key in localStorage.
   */
  static setApiKey(key) {
    if (typeof window !== 'undefined') {
      if (key && key.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  /**
   * Loads the Google Maps JavaScript API with libraries ['places', 'directions', 'geometry'].
   * @param {string} apiKey
   * @returns {Promise<typeof google.maps>}
   */
  static loadGoogleMapsScript(apiKey) {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window not available'));
        return;
      }

      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.onload = () => resolve(window.google.maps);
        existingScript.onerror = (e) => reject(e);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.type = 'text/javascript';
      const keyParam = apiKey ? `key=${encodeURIComponent(apiKey)}&` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but google.maps is undefined.'));
        }
      };

      script.onerror = (err) => {
        reject(err);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Generates a direct Google Maps Embed directions URL for Hyderabad without requiring an API key.
   */
  static getEmbedDirectionsUrl(originAddress, destAddress) {
    const saddr = encodeURIComponent(originAddress || 'Cyber Towers, HITEC City, Hyderabad');
    const daddr = encodeURIComponent(destAddress || 'Gandhi Hospital, Musheerabad, Hyderabad');
    return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&layer=t&output=embed`;
  }
}
