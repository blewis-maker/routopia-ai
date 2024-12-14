import { useEffect, useRef, useState } from 'react';
import { MapService } from '@/services/maps/MapService';
import { LatLngLiteral } from '@/types/maps';

interface UseMapServiceProps {
  elementId: string;
  initialCenter: LatLngLiteral;
  initialZoom?: number;
  isReady?: boolean;
}

export const useMapService = ({ 
  elementId, 
  initialCenter, 
  initialZoom = 14,
  isReady = false 
}: UseMapServiceProps) => {
  const mapServiceRef = useRef<MapService | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!isReady) return;
        
        if (!mapServiceRef.current) {
          mapServiceRef.current = new MapService();
        }

        await mapServiceRef.current.initializeMap(elementId, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: true,
          fullscreenControl: true,
        });
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize map'));
      }
    };

    initializeMap();

    return () => {
      if (mapServiceRef.current) {
        mapServiceRef.current.clearMarkers();
      }
    };
  }, [elementId, initialCenter, initialZoom, isReady]);

  const createMarker = async (props: {
    position: LatLngLiteral;
    title?: string;
    customPin?: boolean;
    onClick?: () => void;
  }) => {
    if (!mapServiceRef.current || !isLoaded) return null;

    try {
      return await mapServiceRef.current.createMarker({
        ...props,
        map: mapServiceRef.current.map!,
      });
    } catch (err) {
      console.error('Error creating marker:', err);
      return null;
    }
  };

  const createWaypointMarker = async (props: {
    position: LatLngLiteral;
    title?: string;
    onClick?: () => void;
    index: number;
  }) => {
    if (!mapServiceRef.current || !isLoaded) return null;

    try {
      return await mapServiceRef.current.createWaypointMarker(
        {
          ...props,
          map: mapServiceRef.current.map!,
        },
        props.index
      );
    } catch (err) {
      console.error('Error creating waypoint marker:', err);
      return null;
    }
  };

  const createDestinationMarker = async (props: {
    position: LatLngLiteral;
    title?: string;
    onClick?: () => void;
  }) => {
    if (!mapServiceRef.current || !isLoaded) return null;

    try {
      return await mapServiceRef.current.createDestinationMarker({
        ...props,
        map: mapServiceRef.current.map!,
      });
    } catch (err) {
      console.error('Error creating destination marker:', err);
      return null;
    }
  };

  const clearMarkers = () => {
    if (mapServiceRef.current) {
      mapServiceRef.current.clearMarkers();
    }
  };

  const panTo = (position: LatLngLiteral) => {
    if (mapServiceRef.current) {
      mapServiceRef.current.panTo(position);
    }
  };

  const setZoom = (zoom: number) => {
    if (mapServiceRef.current) {
      mapServiceRef.current.setZoom(zoom);
    }
  };

  return {
    isLoaded,
    error,
    createMarker,
    createWaypointMarker,
    createDestinationMarker,
    clearMarkers,
    panTo,
    setZoom,
  };
}; 