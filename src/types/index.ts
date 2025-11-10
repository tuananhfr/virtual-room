// Định nghĩa kiểu dữ liệu cho ứng dụng 3D House Tour
declare global {
  // Hotspot - điểm tương tác trên panorama
  export interface Hotspot {
    id: string;
    pitch: number; // góc dọc (lên/xuống)
    yaw: number; // góc ngang (trái/phải)
    type: "link" | "info"; // link: chuyển phòng, info: hiện thông tin
    label: string;
    targetRoom?: string; // ID phòng đích khi click (với type=link)
    description?: string; // mô tả hiển thị (với type=info)
  }

  // Config panorama 360
  export interface Panorama {
    url: string;
    fov?: number; // góc nhìn
  }

  // Dữ liệu 1 phòng
  export interface Room {
    room_id: string;
    room_label: string;
    floor: number; // tầng
    panorama: Panorama;
    hotspots: Hotspot[];
    minimapPosition?: {
      x: number; // vị trí x trên minimap
      y: number; // vị trí y trên minimap
    };
  }

  // Config minimap (sơ đồ mặt bằng)
  export interface MinimapConfig {
    url: string;
    width: number;
    height: number;
    floor: number;
    logo?: string; // logo image URL
  }

  // Dữ liệu toàn bộ căn nhà
  export interface HouseData {
    houseName: string;
    description: string;
    minimap: MinimapConfig;
    rooms: Room[];
  }

  // Props cho PanoramaViewer
  export interface PanoramaViewerProps {
    panoramaUrl: string;
    hotspots: Hotspot[];
    onHotspotClick: (hotspot: Hotspot) => void;
    onCanvasClick?: (pitch: number, yaw: number) => void; // click để đặt hotspot
    editMode?: boolean;
    roomLabel?: string;
    triggerHotspot?: Hotspot | null; // hotspot được trigger từ bên ngoài
    logoUrl?: string; // logo URL to display in bottom-left corner
  }

  export interface RoomSelectorProps {
    rooms: Room[];
    currentRoomId: string | null;
    onRoomChange: (roomId: string) => void;
  }

  // Props cho AdminPanel
  export interface AdminPanelProps {
    houseData: HouseData;
    onUpdateHouseData: (data: HouseData) => void;
    onClose: () => void;
  }

  // Props cho HotspotEditor
  export interface HotspotEditorProps {
    hotspot: Hotspot;
    availableRooms: Room[];
    onUpdate: (hotspot: Hotspot) => void;
    onDelete: () => void;
  }

  // Props cho ImageUploader
  export interface ImageUploaderProps {
    onImageUploaded: (url: string) => void;
    currentUrl?: string;
    label?: string;
  }

  // Props cho MiniMap
  export interface MiniMapProps {
    minimapConfig: MinimapConfig;
    rooms: Room[];
    currentRoomId: string | null;
    onRoomChange?: (roomId: string) => void;
    isEditMode?: boolean; // chế độ edit: cho phép kéo thả vị trí phòng
    onUpdateRoomPosition?: (
      roomId: string,
      position: { x: number; y: number }
    ) => void;
  }
}
