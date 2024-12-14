// Ensure type safety for marker properties
interface MarkerProps {
  position: {
    lat: number;
    lng: number;
  };
  map: google.maps.Map;
  title?: string;
  content?: string | HTMLElement;
  customPin?: boolean;
  onClick?: () => void;
}

class MapMarkerService {
  private readonly mapId = 'DEMO_MAP_ID'; // Replace with your map ID

  async initializeMap(elementId: string, options: google.maps.MapOptions): Promise<google.maps.Map> {
    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
    return new Map(document.getElementById(elementId)!, {
      ...options,
      mapId: this.mapId,
    });
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
        background: "#FBBC04",
        borderColor: "#4285F4",
        glyphColor: "#000000",
      });
      markerOptions.content = pin.element;
    }

    const marker = new AdvancedMarkerElement(markerOptions);

    if (props.onClick) {
      marker.addListener("click", props.onClick);
    }

    return marker;
  }
}

// Usage example
async function initMap() {
  const markerService = new MapMarkerService();
  
  const map = await markerService.initializeMap("map", {
    zoom: 4,
    center: { lat: -25.344, lng: 131.031 },
  });

  const marker = await markerService.createMarker({
    map,
    position: { lat: -25.344, lng: 131.031 },
    title: "Uluru",
    customPin: true,
    onClick: () => console.log("Marker clicked")
  });
}

// Initialize the map when the page loads
window.initMap = initMap;
