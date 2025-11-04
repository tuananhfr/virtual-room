import { useState } from "react";

/**
 * MiniMap component - Hiển thị floor plan với markers cho các phòng
 */
const MiniMap: React.FC<MiniMapProps> = ({
  minimapConfig,
  rooms,
  currentRoomId,
  onRoomChange,
  isEditMode = false,
  onUpdateRoomPosition,
}) => {
  const [draggedRoom, setDraggedRoom] = useState<Room | null>(null);

  if (!minimapConfig.enabled || !minimapConfig.url) {
    return null;
  }

  // Handle room marker click
  const handleMarkerClick = (roomId: string) => {
    if (!isEditMode && onRoomChange) {
      onRoomChange(roomId);
    }
  };

  // Handle drag start
  const handleDragStart = (_: React.DragEvent, room: Room) => {
    if (!isEditMode) return;
    setDraggedRoom(room);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop - update room position
  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode || !draggedRoom || !onUpdateRoomPosition) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onUpdateRoomPosition(draggedRoom.room_id, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });

    setDraggedRoom(null);
  };

  return (
    <div className={isEditMode ? "card shadow-sm" : "card"}>
      {isEditMode && (
        <div className="card-header">
          <h4 className="h6 mb-0 text-uppercase text-muted fw-semibold">
            Floor Plan
          </h4>
        </div>
      )}
      <div
        className="position-relative overflow-hidden"
        style={{
          width: minimapConfig.width,
          height: minimapConfig.height,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Background image */}
        <img
          src={minimapConfig.url}
          alt="Floor plan"
          className="w-100 h-100 d-block"
          style={{ objectFit: "contain" }}
          draggable={false}
        />

        {/* Room markers */}
        {rooms.map((room) => {
          const hasPosition =
            room.minimapPosition &&
            typeof room.minimapPosition.x === "number" &&
            typeof room.minimapPosition.y === "number";

          if (!hasPosition && !isEditMode) return null;

          const x = hasPosition ? room.minimapPosition!.x : 50;
          const y = hasPosition ? room.minimapPosition!.y : 50;

          const isCurrentRoom = room.room_id === currentRoomId;

          return (
            <div
              key={room.room_id}
              className={`position-absolute rounded-circle border border-3 border-white shadow ${
                isCurrentRoom ? "bg-danger" : "bg-primary"
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: "16px",
                height: "16px",
                cursor: isEditMode ? "move" : "pointer",
                opacity: hasPosition ? 1 : 0.5,
                transform: isCurrentRoom
                  ? "translate(-50%, -50%) scale(1.2)"
                  : "translate(-50%, -50%)",
                transition: "transform 0.2s",
                zIndex: 10,
              }}
              onClick={() => handleMarkerClick(room.room_id)}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, room)}
              title={room.room_label}
            >
              <div
                className="position-absolute top-100 start-50 translate-middle-x mt-1 badge bg-dark text-white small"
                style={{
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {room.room_label}
              </div>
            </div>
          );
        })}
      </div>

      {isEditMode && (
        <div className="card-footer">
          <small className="text-muted fst-italic">
            <i className="bi bi-hand-index me-1"></i>
            Drag room markers to set their position on the map
          </small>
        </div>
      )}
    </div>
  );
};

export default MiniMap;
