import { useState, useEffect, useCallback, useRef } from 'react';
import { LatLngLiteral } from '../types/maps';

interface LocationState {
  position: LatLngLiteral | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  address: string;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    position: null,
    accuracy: null,
    error: null,
    isLoading: true,
    address: ''
  });

  const watchIdRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const updateAddress = useCallback(async (position: LatLngLiteral) => {
    if (!window.google || !position) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });

      setState(prev => {
        if (prev.position?.lat === position.lat && prev.position?.lng === position.lng) {
          return {
            ...prev,
            address: response as string
          };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error getting address:', error);
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        isLoading: false
      }));
      return;
    }

    clearWatch();
    setState(prev => ({ ...prev, isLoading: true }));

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setState(prev => {
          if (
            prev.position?.lat !== newPosition.lat ||
            prev.position?.lng !== newPosition.lng ||
            prev.accuracy !== position.coords.accuracy
          ) {
            return {
              ...prev,
              position: newPosition,
              accuracy: position.coords.accuracy,
              isLoading: false,
              error: null
            };
          }
          return prev;
        });

        const timeoutId = setTimeout(() => {
          updateAddress(newPosition);
        }, 1000);

        return () => clearTimeout(timeoutId);
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: 'Unable to retrieve your location. Please enable location services.',
          isLoading: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    watchIdRef.current = id;
  }, [clearWatch, updateAddress]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      startWatching();
    }

    return () => {
      clearWatch();
    };
  }, [startWatching, clearWatch]);

  return {
    ...state,
    startWatching,
    clearWatch
  };
}; 