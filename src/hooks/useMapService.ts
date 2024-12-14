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
  const [routeDetails, setRouteDetails] = useState<{
    distance: string;
    duration: string;
    route: google.maps.DirectionsResult | null;
  }>({
    distance: '',
    duration: '',
    route: null
  });

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
        mapServiceRef.current.clearRoute();
      }
    };
  }, [elementId, initialCenter, initialZoom, isReady]);

  const calculateRoute = async (
    origin: google.maps.LatLngLiteral | google.maps.places.PlaceResult,
    destination: google.maps.LatLngLiteral | google.maps.places.PlaceResult,
    waypoints: google.maps.DirectionsWaypoint[] = []
  ) => {
    if (!mapServiceRef.current || !isLoaded) {
      throw new Error('Map service not initialized');
    }

    try {
      const result = await mapServiceRef.current.calculateRoute(origin, destination, waypoints);
      
      if (result.routes[0]) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteDetails({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
          route: result
        });

        return result;
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      throw err;
    }
  };

  const clearRoute = () => {
    if (mapServiceRef.current) {
      mapServiceRef.current.clearRoute();
      setRouteDetails({
        distance: '',
        duration: '',
        route: null
      });
    }
  };

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
    routeDetails,
    calculateRoute,
    clearRoute,
    createMarker,
    createWaypointMarker,
    createDestinationMarker,
    clearMarkers,
    panTo,
    setZoom,
  };
}; 