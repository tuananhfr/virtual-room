/**
 * Component để chọn phòng từ danh sách
 */
const RoomSelector = ({
  rooms,
  currentRoomId,
  onRoomChange,
}: RoomSelectorProps) => {
  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc: Record<number, Room[]>, room) => {
    const floor = room.floor ?? 0;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(room);
    return acc;
  }, {});

  const floors = Object.keys(roomsByFloor).sort(
    (a, b) => Number(b) - Number(a)
  ); // Sort descending

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h3 className="h5 mb-3 pb-2 border-bottom border-primary">Select Room</h3>

        {floors.map((floor) => (
          <div key={floor} className="mb-3">
            <div className="small text-uppercase text-muted fw-semibold mb-2">
              {floor === "0" ? "Ground Floor" : `Floor ${floor}`}
            </div>

            <div className="d-flex flex-column gap-2">
              {roomsByFloor[Number(floor)].map((room) => (
                <button
                  key={room.room_id}
                  onClick={() => onRoomChange(room.room_id)}
                  className={`btn btn-sm text-start d-flex align-items-center gap-2 ${
                    currentRoomId === room.room_id
                      ? "btn-primary shadow-sm"
                      : "btn-outline-secondary"
                  }`}
                >
                  <span className="fs-5">
                    {room.room_label.includes("Bedroom")
                      ? "🛏️"
                      : room.room_label.includes("Kitchen")
                      ? "🍳"
                      : room.room_label.includes("Bathroom")
                      ? "🚿"
                      : room.room_label.includes("Living")
                      ? "🛋️"
                      : room.room_label.includes("Garden")
                      ? "🌳"
                      : "📍"}
                  </span>
                  <span className="flex-grow-1">{room.room_label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;
