import { LatLngLiteral } from '@/types/maps';

interface MarkerProps {
  position: LatLngLiteral;
  map: google.maps.Map;
  title?: string;
  content?: string | HTMLElement;
  customPin?: boolean;
  onClick?: () => void;
}

export class MapService {
  private readonly mapId = '902e6b9df614e8af';
  public map: google.maps.Map | null = null;
  private markers: google.maps.marker.AdvancedMarkerElement[] = [];
  private directionsService: google.maps.DirectionsService | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;

  async waitForGoogleMaps(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }
  }

  async initializeMap(elementId: string, options: google.maps.MapOptions): Promise<google.maps.Map> {
    await this.waitForGoogleMaps();
    
    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
    const mapElement = document.getElementById(elementId);
    
    if (!mapElement) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    this.map = new Map(mapElement, {
      ...options,
      mapId: this.mapId,
    });

    // Initialize directions service and renderer
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true, // We'll handle markers ourselves
      preserveViewport: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    return this.map;
  }

  async createMarker(props: MarkerProps): Promise<google.maps.marker.AdvancedMarkerElement> {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    let markerOptions: google.maps.marker.AdvancedMarkerElementOptions = {
      map: props.map,
      position: props.position,
      title: props.title,
    };

    if (props.customPin) {
      const pin = new PinElement({
        background: "#4285F4",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.2,
      });
      markerOptions.content = pin.element;
    }

    const marker = new AdvancedMarkerElement(markerOptions);
    this.markers.push(marker);

    if (props.onClick) {
      marker.addListener("click", props.onClick);
    }

    return marker;
  }

  async createWaypointMarker(props: MarkerProps, index: number): Promise<google.maps.marker.AdvancedMarkerElement> {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    const pin = new PinElement({
      background: "#FBBC04",
      borderColor: "#4285F4",
      glyphColor: "#000000",
      glyph: `${index + 1}`,
      scale: 1.2,
    });

    const marker = new AdvancedMarkerElement({
      map: props.map,
      position: props.position,
      title: props.title,
      content: pin.element,
    });

    this.markers.push(marker);

    if (props.onClick) {
      marker.addListener("click", props.onClick);
    }

    return marker;
  }

  async createDestinationMarker(props: MarkerProps): Promise<google.maps.marker.AdvancedMarkerElement> {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    const pin = new PinElement({
      background: "#EA4335",
      borderColor: "#ffffff",
      glyphColor: "#ffffff",
      scale: 1.2,
    });

    const marker = new AdvancedMarkerElement({
      map: props.map,
      position: props.position,
      title: props.title,
      content: pin.element,
    });

    this.markers.push(marker);

    if (props.onClick) {
      marker.addListener("click", props.onClick);
    }

    return marker;
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      marker.map = null;
    });
    this.markers = [];
  }

  panTo(position: LatLngLiteral) {
    if (this.map) {
      this.map.panTo(position);
    }
  }

  setZoom(zoom: number) {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  async calculateRoute(
    origin: google.maps.LatLngLiteral | google.maps.places.PlaceResult,
    destination: google.maps.LatLngLiteral | google.maps.places.PlaceResult,
    waypoints: google.maps.DirectionsWaypoint[] = []
  ): Promise<google.maps.DirectionsResult> {
    if (!this.directionsService || !this.map) {
      console.error('Map Service Error: DirectionsService or Map not initialized');
      throw new Error('Map or DirectionsService not initialized');
    }

    try {
      // Validate and process origin
      const originLocation = this.getLocationFromInput(origin);
      console.debug('Origin processed:', originLocation);

      // Validate and process destination
      const destinationLocation = this.getLocationFromInput(destination);
      console.debug('Destination processed:', destinationLocation);

      // Validate and process waypoints
      const validatedWaypoints = waypoints.map(waypoint => {
        if (!waypoint.location) {
          console.warn('Waypoint missing location:', waypoint);
          throw new Error('Invalid waypoint: missing location');
        }
        return waypoint;
      });

      console.debug('Route Calculation Request:', {
        origin: originLocation,
        destination: destinationLocation,
        waypoints: validatedWaypoints.length ? validatedWaypoints : 'No waypoints',
        timestamp: new Date().toISOString()
      });

      const request: google.maps.DirectionsRequest = {
        origin: originLocation,
        destination: destinationLocation,
        waypoints: validatedWaypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true, // Request alternative routes
        avoidHighways: false,
        avoidTolls: false
      };

      return new Promise((resolve, reject) => {
        this.directionsService!.route(request, (result, status) => {
          console.debug('DirectionsService Response:', { 
            status, 
            resultExists: !!result,
            alternativeRoutes: result?.routes?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          if (status === google.maps.DirectionsStatus.OK && result) {
            if (this.directionsRenderer) {
              // Clear existing markers before rendering new route
              this.clearMarkers();
              
              this.directionsRenderer.setDirections(result);
              
              // Create markers for start and end points
              this.createRouteMarkers(result);
              
              console.debug('Route rendered successfully', {
                routes: result.routes.length,
                primaryRoute: {
                  distance: result.routes[0]?.legs[0]?.distance?.text,
                  duration: result.routes[0]?.legs[0]?.duration?.text,
                },
                waypoints: result.routes[0]?.waypoint_order,
                bounds: result.routes[0]?.bounds?.toJSON()
              });

              // Fit map bounds to show entire route
              if (result.routes[0]?.bounds) {
                this.map?.fitBounds(result.routes[0].bounds);
              }
            } else {
              console.error('DirectionsRenderer not initialized');
            }
            resolve(result);
          } else {
            const errorMessage = this.getDirectionsErrorMessage(status);
            console.error('Route Calculation Error:', {
              status,
              message: errorMessage,
              request,
              timestamp: new Date().toISOString()
            });
            reject(new Error(errorMessage));
          }
        });
      });
    } catch (error) {
      console.error('Route Calculation Exception:', error);
      throw error;
    }
  }

  private async createRouteMarkers(result: google.maps.DirectionsResult) {
    if (!result.routes[0] || !result.routes[0].legs[0]) return;

    const route = result.routes[0];
    const leg = route.legs[0];

    // Create start marker
    await this.createMarker({
      position: {
        lat: leg.start_location.lat(),
        lng: leg.start_location.lng()
      },
      map: this.map!,
      title: leg.start_address,
      customPin: true
    });

    // Create end marker
    await this.createDestinationMarker({
      position: {
        lat: leg.end_location.lat(),
        lng: leg.end_location.lng()
      },
      map: this.map!,
      title: leg.end_address
    });

    // Create waypoint markers
    if (route.waypoint_order) {
      for (let i = 0; i < route.waypoint_order.length; i++) {
        const waypointIndex = route.waypoint_order[i];
        const waypoint = leg.via_waypoints[waypointIndex];
        if (waypoint) {
          await this.createWaypointMarker({
            position: {
              lat: waypoint.lat(),
              lng: waypoint.lng()
            },
            map: this.map!,
            title: `Waypoint ${i + 1}`
          }, i);
        }
      }
    }
  }

  private getDirectionsErrorMessage(status: google.maps.DirectionsStatus): string {
    switch (status) {
      case google.maps.DirectionsStatus.NOT_FOUND:
        return 'At least one of the locations specified in the request could not be found';
      case google.maps.DirectionsStatus.ZERO_RESULTS:
        return 'No route could be found between the origin and destination';
      case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
        return 'Too many waypoints were provided in the request';
      case google.maps.DirectionsStatus.INVALID_REQUEST:
        return 'The request was invalid';
      case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
        return 'Service has received too many requests within the allowed time period';
      case google.maps.DirectionsStatus.REQUEST_DENIED:
        return 'Service denied use of the directions service';
      case google.maps.DirectionsStatus.UNKNOWN_ERROR:
        return 'A directions request could not be processed due to a server error';
      default:
        return `Failed to calculate route: ${status}`;
    }
  }

  private getLocationFromInput(
    input: google.maps.LatLngLiteral | google.maps.places.PlaceResult
  ): google.maps.LatLngLiteral | string {
    if ('geometry' in input && input.geometry?.location) {
      return {
        lat: input.geometry.location.lat(),
        lng: input.geometry.location.lng()
      };
    }
    return input as google.maps.LatLngLiteral;
  }

  clearRoute() {
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
  }
} 