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
} 