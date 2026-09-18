import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Component to update map view when coordinates change
 */
const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        if (center && center[0] !== 0 && center[1] !== 0) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    
    return null;
};

/**
 * Component to handle map clicks
 */
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                const { lat, lng } = e.latlng;
                onLocationSelect(lat, lng);
            }
        },
    });
    
    return null;
};

/**
 * LocationMap Component
 * Interactive map for viewing or selecting listing location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {function} onLocationSelect - Callback when user clicks on map (optional, only for marker placement)
 * @param {string} height - Map height
 * @param {boolean} interactive - Allow dragging and zooming (default: true)
 * @param {boolean} allowMarkerPlacement - Allow clicking to place markers (default: false, requires onLocationSelect)
 */
const LocationMap = ({ lat, lng, onLocationSelect, height = '400px', interactive = true, allowMarkerPlacement = false }) => {
    const hasValidCoordinates = lat !== 0 || lng !== 0;
    const center = hasValidCoordinates ? [lat, lng] : [14.5995, 120.9842]; // Default to Manila
    const zoom = hasValidCoordinates ? 15 : 11;
    
    // Only allow marker placement if explicitly enabled and callback is provided
    const canPlaceMarkers = allowMarkerPlacement && onLocationSelect;
    
    return (
        <div className="w-full rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: height, width: '100%' }}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={interactive}
                doubleClickZoom={interactive}
                touchZoom={interactive}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {hasValidCoordinates && (
                    <Marker position={[lat, lng]} />
                )}
                
                <MapUpdater center={center} zoom={zoom} />
                {canPlaceMarkers && <MapClickHandler onLocationSelect={onLocationSelect} />}
            </MapContainer>
            
            {canPlaceMarkers && (
                <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
                    <p className="text-xs text-blue-800">
                        💡 <strong>Tip:</strong> Click anywhere on the map to set the exact location of your listing
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationMap;

