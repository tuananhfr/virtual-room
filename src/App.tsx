import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PanoramaViewer from "./components/viewer/PanoramaViewer";
import AdminPanel from "./components/admin/AdminPanel";
import MiniMap from "./components/common/MiniMap";
import { useHouseData } from "./hooks/useHouseData";

/**
 * Main App component cho 3D house viewer
 */
const App = () => {
  const { houseData, setHouseData, resetToDefault } = useHouseData();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentFloorId, setCurrentFloorId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [triggerHotspot, setTriggerHotspot] = useState<Hotspot | null>(null);
  const minimapToggleButtonRef = useRef<HTMLButtonElement>(null);

  // Get all rooms from all floors
  const allRooms = useMemo(() => {
    return houseData.floors.flatMap(floor => floor.rooms);
  }, [houseData.floors]);

  // Get current floor
  const currentFloor = useMemo(() => {
    if (currentFloorId) {
      return houseData.floors.find(f => f.floor_id === currentFloorId);
    }
    // If no floor selected, use the floor of current room
    if (currentRoomId) {
      return houseData.floors.find(floor =>
        floor.rooms.some(r => r.room_id === currentRoomId)
      );
    }
    // Default to first floor
    return houseData.floors[0];
  }, [currentFloorId, currentRoomId, houseData.floors]);

  // Auto-select first room when rooms are available
  useEffect(() => {
    if (allRooms.length > 0 && !currentRoomId) {
      setCurrentRoomId(allRooms[0].room_id);
      const floor = houseData.floors.find(f =>
        f.rooms.some(r => r.room_id === allRooms[0].room_id)
      );
      if (floor) setCurrentFloorId(floor.floor_id);
    }
    // Reset currentRoomId if current room no longer exists
    if (
      currentRoomId &&
      !allRooms.find((r: Room) => r.room_id === currentRoomId)
    ) {
      setCurrentRoomId(
        allRooms.length > 0 ? allRooms[0].room_id : null
      );
    }
  }, [allRooms, currentRoomId, houseData.floors]);

  // Reset triggerHotspot when room changes
  useEffect(() => {
    setTriggerHotspot(null);
  }, [currentRoomId]);

  // Get current room data
  const currentRoom = allRooms.find(
    (room: Room) => room.room_id === currentRoomId
  );

  // Memoize hotspots to prevent unnecessary re-renders
  const currentHotspots = useMemo(() => {
    return currentRoom?.hotspots || [];
  }, [currentRoomId, allRooms]);

  // Auto open admin panel if no rooms
  const hasNoRooms = allRooms.length === 0;

  // Handle hotspot click
  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    if (hotspot.targetRoom) {
      // Navigate to linked room
      setCurrentRoomId(hotspot.targetRoom);
    }
  }, []);

  // Handle room change with animation (find hotspot and animate to it)
  const handleRoomChangeWithAnimation = useCallback(
    (targetRoomId: string) => {
      if (!currentRoom || targetRoomId === currentRoomId) return;

      // Find hotspot in current room that links to target room
      const hotspot = currentRoom.hotspots.find(
        (h) => h.targetRoom === targetRoomId
      );

      if (hotspot) {
        // Trigger animation to hotspot, then navigate
        setTriggerHotspot(hotspot);
      } else {
        // No hotspot found, navigate directly
        setCurrentRoomId(targetRoomId);
      }
    },
    [currentRoom, currentRoomId]
  );

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      {/* Header */}
      <header className="bg-primary text-white py-3 px-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-1">{houseData.houseName}</h1>
            <p className="mb-0 small opacity-75">{houseData.description}</p>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="btn btn-warning"
            >
              <i className="bi bi-gear-fill me-1"></i>
              Admin Mode
            </button>

            {!hasNoRooms && (
              <button onClick={resetToDefault} className="btn btn-danger">
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-fill d-flex p-3 overflow-hidden">
        {/* Empty State */}
        {hasNoRooms ? (
          <div className="flex-fill d-flex align-items-center justify-content-center bg-white rounded shadow">
            <div className="text-center p-5">
              <i className="bi bi-house-x display-1 text-muted mb-3"></i>
              <h3 className="text-muted mb-3">No Rooms Available</h3>
              <p className="text-muted mb-4">
                Please add rooms using Admin Mode to get started.
              </p>
              <button
                onClick={() => setShowAdminPanel(true)}
                className="btn btn-primary"
              >
                <i className="bi bi-gear-fill me-2"></i>
                Open Admin Panel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Panorama Viewer */}
            {currentRoom && (
              <main
                className="flex-fill position-relative bg-dark rounded overflow-hidden shadow"
                style={{ flex: 1 }}
              >
                <PanoramaViewer
                  panoramaUrl={currentRoom.panorama.url}
                  hotspots={currentHotspots}
                  onHotspotClick={handleHotspotClick}
                  roomLabel={currentRoom.room_label}
                  triggerHotspot={triggerHotspot}
                />

                {/* MiniMap Overlay - Top Right Corner */}
                {houseData.minimap.url && (
                  <div
                    className="position-absolute top-0 end-0 m-3"
                    style={{ zIndex: 100 }}
                  >
                    {/* MiniMap container with slide animation */}
                    <div
                      className="shadow-lg"
                      style={{
                        transform: showMinimap
                          ? "translateX(0)"
                          : `translateX(calc(100% + 16px))`,
                        transition: "transform 0.3s ease-in-out",
                      }}
                    >
                      <MiniMap
                        minimapConfig={houseData.minimap}
                        rooms={houseData.rooms}
                        currentRoomId={currentRoomId}
                        onRoomChange={handleRoomChangeWithAnimation}
                        isEditMode={false}
                      />
                      {/* Toggle button - Hide/Show */}
                      <button
                        ref={minimapToggleButtonRef}
                        onClick={() => setShowMinimap(!showMinimap)}
                        className="btn btn-sm btn-primary position-absolute top-50 translate-middle-y shadow-sm"
                        style={{
                          left: showMinimap
                            ? `${
                                -(
                                  minimapToggleButtonRef.current?.offsetWidth ||
                                  32
                                ) + 2
                              }px`
                            : `calc(${houseData.minimap.width} - 12px)`,
                          height: houseData.minimap.height,
                          transition: "left 0.3s ease-in-out",
                        }}
                        title={showMinimap ? "Hide minimap" : "Show minimap"}
                      >
                        <i
                          className={`bi bi-chevron-compact-${
                            showMinimap ? "right" : "left"
                          }`}
                        ></i>
                      </button>
                    </div>
                  </div>
                )}
              </main>
            )}
          </>
        )}
      </div>

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          houseData={houseData}
          onUpdateHouseData={setHouseData}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
};

export default App;
