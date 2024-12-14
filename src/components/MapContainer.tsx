import { useCallback, useEffect, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';
import SearchBar from './map/SearchBar';
import LocationDetails from './map/LocationDetails';
import ShareLocation from './map/ShareLocation';
import { useLocation } from '../hooks/useLocation';
import { useMapState } from '../hooks/useMapState';
import { useMapService } from '../hooks/useMapService';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

// Define libraries array outside component to prevent reloading
const libraries = ["places", "marker"] as const;

const MapContainer = () => {
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { position, accuracy, error: locationError, isLoading, address, startWatching } = useLocation();
  const { destination, waypoints, setDestination, addWaypoint, clearRoute: clearMapState } = useMapState();
  
  const mapService = useMapService({
    elementId: 'map',
    initialCenter: position || defaultCenter,
    initialZoom: 14,
    isReady: isScriptLoaded
  });

  const handleScriptLoad = useCallback(() => {
    setIsScriptLoaded(true);
  }, []);

  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapService.isLoaded || !isScriptLoaded) return;

      mapService.clearMarkers();

      if (position) {
        await mapService.createMarker({
          position,
          title: 'Your Location',
          customPin: true
        });
      }
    };

    updateMarkers();
  }, [position, mapService.isLoaded, isScriptLoaded]);

  const handleRouteSelected = useCallback(async (
    origin: google.maps.places.PlaceResult,
    destination: google.maps.places.PlaceResult,
    waypoints: google.maps.places.PlaceResult[]
  ) => {
    try {
      if (!mapService.isLoaded) {
        console.error('Map service not loaded');
        return;
      }

      console.debug('Route selection started:', {
        origin,
        destination,
        waypoints,
        hasMapService: !!mapService,
        isMapServiceLoaded: mapService.isLoaded
      });

      // Handle origin location
      let originLocation: google.maps.LatLngLiteral | string;
      if (origin.geometry?.location) {
        originLocation = {
          lat: origin.geometry.location.lat(),
          lng: origin.geometry.location.lng()
        };
      } else if (origin.formatted_address) {
        originLocation = origin.formatted_address;
      } else {
        console.error('Invalid origin format:', origin);
        throw new Error('Invalid origin location format');
      }

      // Handle destination location
      let destinationLocation: google.maps.LatLngLiteral | string;
      if (destination.geometry?.location) {
        destinationLocation = {
          lat: destination.geometry.location.lat(),
          lng: destination.geometry.location.lng()
        };
      } else if (destination.formatted_address) {
        destinationLocation = destination.formatted_address;
      } else {
        console.error('Invalid destination format:', destination);
        throw new Error('Invalid destination location format');
      }

      const waypointsList = waypoints.map(waypoint => {
        if (!waypoint.geometry?.location && !waypoint.formatted_address) {
          console.warn('Invalid waypoint format:', waypoint);
          throw new Error('Invalid waypoint format');
        }
        return {
          location: waypoint.formatted_address || {
            lat: waypoint.geometry!.location!.lat(),
            lng: waypoint.geometry!.location!.lng()
          },
          stopover: true
        };
      });

      console.debug('Calculating route with:', {
        originLocation,
        destinationLocation,
        waypointsList
      });

      const result = await mapService.calculateRoute(
        originLocation,
        destinationLocation,
        waypointsList
      );

      console.debug('Route calculation successful:', {
        resultStatus: result.status,
        routes: result.routes.length,
        waypoints: result.routes[0]?.waypoint_order
      });
      
      setDestination(destination);
      waypoints.forEach(waypoint => addWaypoint(waypoint));
    } catch (error) {
      console.error('Route calculation error:', error);
      // You might want to show this error to the user
      if (error instanceof Error) {
        // Handle the error appropriately in your UI
        console.error('Route Error:', error.message);
      }
    }
  }, [mapService, setDestination, addWaypoint]);

  const handleClearRoute = useCallback(() => {
    mapService.clearRoute();
    clearMapState();
  }, [mapService, clearMapState]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-sm">
          <div className="text-red-500 text-lg mb-4">
            Failed to load Google Maps. Please try again later.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Locating you...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        libraries={libraries}
        onLoad={handleScriptLoad}
        onError={setLoadError}
      >
        <SearchBar 
          onRouteSelected={handleRouteSelected}
          initialOrigin={position ? `${position.lat}, ${position.lng}` : ''}
        />
        
        <div id="map" style={containerStyle} />

        {position && mapService.isLoaded && isScriptLoaded && (
          <>
            <LocationDetails
              position={position}
              accuracy={accuracy || undefined}
            />
            
            {mapService.routeDetails.route && (
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-700">Distance: {mapService.routeDetails.distance}</div>
                    <div className="text-gray-600">Duration: {mapService.routeDetails.duration}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-6 right-6 flex flex-col space-y-2">
              {mapService.routeDetails.route && (
                <button
                  onClick={handleClearRoute}
                  className="bg-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-gray-700">Clear Route</span>
                </button>
              )}
              
              <ShareLocation
                position={position}
                address={address}
              />
              
              <button
                onClick={() => mapService.panTo(position)}
                className="bg-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700">Center on me</span>
              </button>
            </div>
          </>
        )}
      </LoadScript>
    </div>
  );
};

export default MapContainer; 