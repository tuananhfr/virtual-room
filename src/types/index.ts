/**
 * TypeScript type definitions for 3D House Tour
 */
declare global {
  // Hotspot types
  export interface Hotspot {
    id: string;
    pitch: number;
    yaw: number;
    type: "link" | "info";
    label: string;
    targetRoom?: string; // Room ID to navigate to (for link hotspots)
    description?: string; // Description to show (for info hotspots)
  }

  // Panorama configuration
  export interface Panorama {
    url: string;
    fov?: number; // Field of view
  }

  // Room data structure
  export interface Room {
    room_id: string;
    room_label: string;
    floor: number;
    panorama: Panorama;
    hotspots: Hotspot[];
    minimapPosition?: {
      x: number;
      y: number;
    };
  }

  // Minimap configuration
  export interface MinimapConfig {
    url: string;
    width: number;
    height: number;
    floor: number; // Floor number for this minimap
  }

  // House data structure
  export interface HouseData {
    houseName: string;
    description: string;
    minimap: MinimapConfig;
    rooms: Room[];
  }

  // Component Props
  export interface PanoramaViewerProps {
    panoramaUrl: string;
    hotspots: Hotspot[];
    onHotspotClick: (hotspot: Hotspot) => void;
    onCanvasClick?: (pitch: number, yaw: number) => void;
    editMode?: boolean;
    roomLabel?: string;
    triggerHotspot?: Hotspot | null;
  }

  export interface RoomSelectorProps {
    rooms: Room[];
    currentRoomId: string | null;
    onRoomChange: (roomId: string) => void;
  }

  export interface AdminPanelProps {
    houseData: HouseData;
    onUpdateHouseData: (data: HouseData) => void;
    onClose: () => void;
  }

  export interface HotspotEditorProps {
    hotspot: Hotspot;
    availableRooms: Room[];
    onUpdate: (hotspot: Hotspot) => void;
    onDelete: () => void;
  }

  export interface ImageUploaderProps {
    onImageUploaded: (url: string) => void;
    currentUrl?: string;
    label?: string;
  }

  export interface MiniMapProps {
    minimapConfig: MinimapConfig;
    rooms: Room[];
    currentRoomId: string | null;
    onRoomChange?: (roomId: string) => void;
    isEditMode?: boolean;
    onUpdateRoomPosition?: (
      roomId: string,
      position: { x: number; y: number }
    ) => void;
  }
}
