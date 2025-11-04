import { useState, useEffect } from "react";

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Reset pan position when zoom returns to 1 or less
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  if (!minimapConfig.url) {
    return null;
  }

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (zoom > 1 && !isEditMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle pan move
  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  // Handle pan end
  const handlePanEnd = () => {
    setIsPanning(false);
  };

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
          cursor: zoom > 1 && !isEditMode ? (isPanning ? "grabbing" : "grab") : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        {/* Zoomable container for image and markers */}
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
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
          const isHovered = hoveredRoomId === room.room_id;

          return (
            <div
              key={room.room_id}
              className={`position-absolute rounded-circle border border-3 border-white shadow ${
                isCurrentRoom || isHovered ? "bg-danger" : "bg-primary"
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: "16px",
                height: "16px",
                cursor: isEditMode ? "move" : "pointer",
                opacity: hasPosition ? 1 : 0.5,
                transform: isCurrentRoom || isHovered
                  ? `translate(-50%, -50%) scale(${1.2 / zoom})`
                  : `translate(-50%, -50%) scale(${1 / zoom})`,
                transition: "transform 0.1s ease-out, background-color 0.2s ease-out",
                zIndex: isCurrentRoom || isHovered ? 20 : 10,
              }}
              onClick={() => handleMarkerClick(room.room_id)}
              onMouseEnter={() => !isEditMode && setHoveredRoomId(room.room_id)}
              onMouseLeave={() => !isEditMode && setHoveredRoomId(null)}
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
