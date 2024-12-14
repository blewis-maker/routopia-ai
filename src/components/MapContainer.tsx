import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { SearchBox } from './map/SearchBox';
import { LocationDetails } from './map/LocationDetails';
import { ShareLocation } from './map/ShareLocation';
import { useLocation } from '../hooks/useLocation';
import { useMapState } from '../hooks/useMapState';
import { useMapRefs } from '../hooks/useMapRefs';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

const createUserMarkerIcon = (google: typeof window.google) => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 8,
  fillColor: '#4285F4',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2
});

const libraries: ["places"] = ["places"];

export const MapContainer = () => {
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<google.maps.Symbol | null>(null);
  
  const { position, accuracy, error: locationError, isLoading, address, startWatching } = useLocation();
  const { destination, waypoints, directions, setDestination, addWaypoint, setDirections, clearRoute } = useMapState();
  const { mapRef, directionsServiceRef, onLoad, onUnmount, panTo } = useMapRefs();

  useEffect(() => {
    if (window.google && !markerIcon) {
      setMarkerIcon(createUserMarkerIcon(window.google));
    }
  }, [markerIcon]);

  useEffect(() => {
    if (locationError) {
      console.error('Location Error:', locationError);
    }
  }, [locationError]);

  const handleLoadError = useCallback((error: Error) => {
    console.error('Map Load Error:', error);
    setLoadError(error);
  }, []);

  const handleLoad = useCallback((map: google.maps.Map) => {
    try {
      onLoad(map);
      setIsMapLoaded(true);
      if (window.google) {
        setMarkerIcon(createUserMarkerIcon(window.google));
      }
    } catch (error) {
      console.error('Map Load Error:', error);
      setLoadError(error instanceof Error ? error : new Error('Failed to load map'));
    }
  }, [onLoad]);

  const calculateRoute = useCallback(() => {
    if (!position || !destination || !directionsServiceRef.current || !window.google) {
      return;
    }

    try {
      const waypointsList = waypoints.map(waypoint => ({
        location: { 
          lat: waypoint.geometry.location.lat(),
          lng: waypoint.geometry.location.lng()
        },
        stopover: true
      }));

      directionsServiceRef.current.route(
        {
          origin: position,
          destination: {
            lat: destination.geometry.location.lat(),
            lng: destination.geometry.location.lng()
          },
          waypoints: waypointsList,
          optimizeWaypoints: true,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.error('Error fetching directions:', status);
          }
        }
      );
    } catch (error) {
      console.error('Route Calculation Error:', error);
    }
  }, [position, destination, waypoints, directionsServiceRef, setDirections]);

  const handlePlaceSelected = useCallback((
    place: any,
    type: 'destination' | 'waypoint'
  ) => {
    try {
      if (place?.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        if (type === 'destination') {
          setDestination(place);
        } else {
          addWaypoint(place);
        }

        panTo(location);
        setTimeout(calculateRoute, 100);
      }
    } catch (error) {
      console.error('Place Selection Error:', error);
    }
  }, [setDestination, addWaypoint, panTo, calculateRoute]);

  const handleRecenterClick = useCallback(() => {
    try {
      if (position) {
        panTo(position);
      } else {
        startWatching();
      }
    } catch (error) {
      console.error('Recenter Error:', error);
    }
  }, [position, panTo, startWatching]);

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

  if (locationError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-sm">
          <div className="text-red-500 text-lg mb-4">{locationError}</div>
          <button
            onClick={startWatching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        libraries={libraries}
        onError={handleLoadError}
      >
        <SearchBox onPlaceSelected={handlePlaceSelected} />
        
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={position || defaultCenter}
          zoom={14}
          onLoad={handleLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true
          }}
        >
          {isMapLoaded && markerIcon && (
            <>
              {position && !directions && (
                <Marker
                  position={position}
                  icon={markerIcon}
                  title="Your Location"
                />
              )}
              
              {!directions && (
                <>
                  {destination && (
                    <Marker
                      position={{
                        lat: destination.geometry.location.lat(),
                        lng: destination.geometry.location.lng()
                      }}
                      title={destination.name || 'Destination'}
                    />
                  )}
                  
                  {waypoints.map((waypoint, index) => (
                    <Marker
                      key={index}
                      position={{
                        lat: waypoint.geometry.location.lat(),
                        lng: waypoint.geometry.location.lng()
                      }}
                      label={String(index + 1)}
                      title={waypoint.name || `Waypoint ${index + 1}`}
                    />
                  ))}
                </>
              )}

              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: false,
                    preserveViewport: true
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>

        {position && isMapLoaded && (
          <>
            <LocationDetails
              position={position}
              accuracy={accuracy || undefined}
            />
            <div className="absolute bottom-6 right-6 flex flex-col space-y-2">
              {(directions || waypoints.length > 0) && (
                <button
                  onClick={clearRoute}
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
                onClick={handleRecenterClick}
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