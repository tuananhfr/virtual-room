import { useState, useEffect, useRef } from "react";
import PanoramaViewer from "./components/viewer/PanoramaViewer";
import AdminPanel from "./components/admin/AdminPanel";
import MiniMap from "./components/common/MiniMap";
import { useHouseData } from "./hooks/useHouseData";

// Component chính quản lý toàn bộ ứng dụng 3D house tour
const App = () => {
  const { houseData, setHouseData, resetToDefault } = useHouseData();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const minimapToggleButtonRef = useRef<HTMLButtonElement>(null);

  // tự động chọn phòng đầu tiên khi có data
  useEffect(() => {
    if (houseData.rooms.length > 0 && !currentRoomId) {
      setCurrentRoomId(houseData.rooms[0].room_id);
    }
    // reset nếu phòng hiện tại bị xóa
    if (
      currentRoomId &&
      !houseData.rooms.find((r: Room) => r.room_id === currentRoomId)
    ) {
      setCurrentRoomId(
        houseData.rooms.length > 0 ? houseData.rooms[0].room_id : null
      );
    }
  }, [houseData.rooms, currentRoomId]);

  // lấy data phòng hiện tại
  const currentRoom = houseData.rooms.find(
    (room: Room) => room.room_id === currentRoomId
  );

  const hasNoRooms = houseData.rooms.length === 0;

  // chuyển phòng
  const handleRoomChange = (roomId: string) => {
    setCurrentRoomId(roomId);
  };

  // xử lý click hotspot
  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.targetRoom) {
      handleRoomChange(hotspot.targetRoom);
    }
  };

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
          <div className="flex-fill d-flex align-items-center justify-content-center bg-white rounded">
            <div className="text-center p-5" style={{ maxWidth: "600px" }}>
              <h2 className="display-5 fw-bold text-dark mb-3">
                Welcome to 3D House Tour Builder!
              </h2>
              <p className="text-muted mb-4 fs-5">
                Get started by adding your first room with panorama images
              </p>
              <div className="d-flex justify-content-center mb-4">
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="btn btn-primary btn-lg"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Open Admin Mode
                </button>
              </div>
              <div className="alert alert-info text-start">
                <strong>Quick Start:</strong>
                <ol className="mb-0 mt-2">
                  <li>Click "Open Admin Mode" to add rooms</li>
                  <li>Enter Room ID, Label, Floor, and Panorama URL</li>
                  <li>Click on 3D view to place hotspots</li>
                  <li>Configure hotspots (link to other rooms or show info)</li>
                </ol>
              </div>
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
                  hotspots={currentRoom.hotspots}
                  onHotspotClick={handleHotspotClick}
                  roomLabel={currentRoom.room_label}
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
                        onRoomChange={handleRoomChange}
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
