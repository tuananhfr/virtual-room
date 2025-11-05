import { useState, useEffect, useRef } from "react";

// Component minimap - hiển thị sơ đồ mặt bằng với marker các phòng
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
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoPanRef = useRef<number | null>(null);
  const autoPanVelocityRef = useRef({ x: 0, y: 0 });

  // reset pan khi zoom về 1
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // cleanup auto-pan khi unmount
  useEffect(() => {
    return () => {
      if (autoPanRef.current !== null) {
        cancelAnimationFrame(autoPanRef.current);
      }
    };
  }, []);

  // Lắng nghe drag event ở document level để bắt khi kéo ra ngoài
  useEffect(() => {
    if (!isEditMode || !draggedRoom || !containerRef.current || zoom <= 1) {
      return;
    }

    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const panSpeed = 5;

      // Tính vị trí chuột so với container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let velocityX = 0;
      let velocityY = 0;

      // Kiểm tra nếu chuột ra ngoài biên -> auto-pan
      if (mouseX < 0) {
        velocityX = panSpeed;
      } else if (mouseX > rect.width) {
        velocityX = -panSpeed;
      }

      if (mouseY < 0) {
        velocityY = panSpeed;
      } else if (mouseY > rect.height) {
        velocityY = -panSpeed;
      }

      // Cập nhật velocity
      autoPanVelocityRef.current = { x: velocityX, y: velocityY };

      // Bắt đầu auto-pan loop nếu chưa chạy
      if (autoPanRef.current === null && (velocityX !== 0 || velocityY !== 0)) {
        const autoPanLoop = () => {
          const velocity = autoPanVelocityRef.current;

          if (velocity.x !== 0 || velocity.y !== 0) {
            setPan((prevPan) => {
              // Tính giới hạn pan dựa trên zoom
              const maxPan = rect.width * (zoom - 1) / 2;
              const maxPanY = rect.height * (zoom - 1) / 2;

              const newPan = {
                x: prevPan.x + velocity.x,
                y: prevPan.y + velocity.y,
              };

              // Giới hạn pan trong phạm vi hợp lý
              newPan.x = Math.max(-maxPan, Math.min(maxPan, newPan.x));
              newPan.y = Math.max(-maxPanY, Math.min(maxPanY, newPan.y));

              return newPan;
            });
            autoPanRef.current = requestAnimationFrame(autoPanLoop);
          } else {
            autoPanRef.current = null;
          }
        };
        autoPanRef.current = requestAnimationFrame(autoPanLoop);
      } else if (autoPanRef.current !== null && velocityX === 0 && velocityY === 0) {
        cancelAnimationFrame(autoPanRef.current);
        autoPanRef.current = null;
      }
    };

    document.addEventListener("dragover", handleDocumentDragOver);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
    };
  }, [isEditMode, draggedRoom, zoom]);

  if (!minimapConfig.url) {
    return null;
  }

  // zoom bằng chuột
  const handleWheelNative = (e: WheelEvent) => {
    e.preventDefault(); // chặn scroll form bên ngoài
    e.stopPropagation();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  // gắn event wheel vào container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative as EventListener);
    };
  }, [zoom]);

  // bắt đầu kéo ảnh (pan)
  const handlePanStart = (e: React.MouseEvent) => {
    if (zoom > 1) {
      const target = e.target as HTMLElement;
      const isMarkerClick = target.closest("[data-room-marker]");

      if (!isMarkerClick) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  // di chuyển ảnh
  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const maxPan = rect.width * (zoom - 1) / 2;
      const maxPanY = rect.height * (zoom - 1) / 2;

      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;

      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, newPanX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newPanY)),
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // click vào marker để chuyển phòng
  const handleMarkerClick = (roomId: string) => {
    if (!isEditMode && onRoomChange) {
      onRoomChange(roomId);
    }
  };

  // bắt đầu kéo marker (chế độ edit)
  const handleDragStart = (_: React.DragEvent, room: Room) => {
    if (!isEditMode) return;
    setDraggedRoom(room);
  };

  // xử lý khi drag kết thúc (kể cả khi hủy)
  const handleDragEnd = () => {
    // Dừng auto-pan
    if (autoPanRef.current !== null) {
      cancelAnimationFrame(autoPanRef.current);
      autoPanRef.current = null;
    }
    autoPanVelocityRef.current = { x: 0, y: 0 };
    setDraggedRoom(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // thả marker -> cập nhật vị trí
  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode || !draggedRoom || !onUpdateRoomPosition) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // convert sang %
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
          cursor:
            zoom > 1
              ? isPanning
                ? "grabbing"
                : "grab"
              : isEditMode
              ? "grab"
              : "default",
          // Chặn scroll chaining lên form khi đang hover ảnh
          overscrollBehavior: isHoveringImage ? "contain" : undefined,
        }}
        ref={containerRef}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={() => {
          handlePanEnd();
          setIsHoveringImage(false);
        }}
        onMouseEnter={() => setIsHoveringImage(true)}
      >
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
          <img
            src={minimapConfig.url}
            alt="Floor plan"
            className="w-100 h-100 d-block"
            style={{ objectFit: "contain" }}
            draggable={false}
          />

          {rooms.map((room) => {
            const hasPosition =
              room.minimapPosition &&
              typeof room.minimapPosition.x === "number" &&
              typeof room.minimapPosition.y === "number";

            // chỉ hiện marker có vị trí (trừ khi đang edit)
            if (!hasPosition && !isEditMode) return null;

            const x = hasPosition ? room.minimapPosition!.x : 50;
            const y = hasPosition ? room.minimapPosition!.y : 50;

            const isCurrentRoom = room.room_id === currentRoomId;
            const isHovered = hoveredRoomId === room.room_id;

            return (
              <div
                key={room.room_id}
                data-room-marker
                className={`position-absolute rounded-circle border border-3 border-white shadow ${
                  isCurrentRoom || isHovered ? "bg-danger" : "bg-primary"
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  opacity: hasPosition ? 1 : 0.5,
                  transform:
                    isCurrentRoom || isHovered
                      ? `translate(-50%, -50%) scale(${1.2 / zoom})`
                      : `translate(-50%, -50%) scale(${1 / zoom})`,
                  transition:
                    "transform 0.1s ease-out, background-color 0.2s ease-out",
                  zIndex: isCurrentRoom || isHovered ? 20 : 10,
                }}
                onClick={() => handleMarkerClick(room.room_id)}
                onMouseEnter={() =>
                  !isEditMode && setHoveredRoomId(room.room_id)
                }
                onMouseLeave={() => !isEditMode && setHoveredRoomId(null)}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, room)}
                onDragEnd={handleDragEnd}
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
