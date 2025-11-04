import { useState } from "react";
import HotspotEditor from "./HotspotEditor";
import ImageUploader from "../common/ImageUploader";
import MiniMap from "../common/MiniMap";

/**
 * Component Admin Panel để quản lý rooms và hotspots
 */
const AdminPanel = ({
  houseData,
  onUpdateHouseData,
  onClose,
}: AdminPanelProps) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);
  const [newRoom, setNewRoom] = useState<Room>({
    room_id: "",
    room_label: "",
    floor: 1,
    panorama: { url: "" },
    hotspots: [],
    minimapPosition: { x: 50, y: 50 }, // Default center position
  });

  // Add new room
  const handleAddRoom = () => {
    if (!newRoom.room_id || !newRoom.room_label || !newRoom.panorama.url) {
      alert("Please fill in Room ID, Label and Panorama URL");
      return;
    }

    const updatedData = {
      ...houseData,
      rooms: [...houseData.rooms, { ...newRoom }],
    };

    onUpdateHouseData(updatedData);

    // Reset form
    setNewRoom({
      room_id: "",
      room_label: "",
      floor: 1,
      panorama: { url: "" },
      hotspots: [],
      minimapPosition: { x: 50, y: 50 }, // Default center position
    });
  };

  // Delete room
  const handleDeleteRoom = (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    const updatedData = {
      ...houseData,
      rooms: houseData.rooms.filter((r) => r.room_id !== roomId),
    };

    onUpdateHouseData(updatedData);
  };

  // Edit room
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowHotspotEditor(false);
  };

  // Save edited room
  const handleSaveEditedRoom = () => {
    if (!editingRoom) return;

    const updatedData = {
      ...houseData,
      rooms: houseData.rooms.map((r) =>
        r.room_id === editingRoom.room_id ? editingRoom : r
      ),
    };

    onUpdateHouseData(updatedData);
    setEditingRoom(null);
  };

  // Add hotspot to editing room
  const handleAddHotspot = ({ pitch, yaw }: { pitch: number; yaw: number }) => {
    if (!editingRoom) return;

    const newHotspot: Hotspot = {
      id: `hs_${Date.now()}`,
      type: "link",
      pitch: Math.round(pitch * 100) / 100,
      yaw: Math.round(yaw * 100) / 100,
      label: "Đi đến...",
      targetRoom: "",
    };

    setEditingRoom({
      ...editingRoom,
      hotspots: [...editingRoom.hotspots, newHotspot],
    });
  };

  // Remove hotspot
  const handleRemoveHotspot = (index: number) => {
    if (!editingRoom) return;

    setEditingRoom({
      ...editingRoom,
      hotspots: editingRoom.hotspots.filter((_, i) => i !== index),
    });
  };

  // Update hotspot
  const handleUpdateHotspot = (index: number, updatedHotspot: Hotspot) => {
    if (!editingRoom) return;

    setEditingRoom({
      ...editingRoom,
      hotspots: editingRoom.hotspots.map((h, i) =>
        i === index ? updatedHotspot : h
      ),
    });
  };

  // Update minimap config
  const handleUpdateMinimapConfig = (config: MinimapConfig) => {
    onUpdateHouseData({
      ...houseData,
      minimap: config,
    });
  };

  // Update room position on minimap
  const handleUpdateRoomPosition = (
    roomId: string,
    position: { x: number; y: number }
  ) => {
    onUpdateHouseData({
      ...houseData,
      rooms: houseData.rooms.map((r) =>
        r.room_id === roomId ? { ...r, minimapPosition: position } : r
      ),
    });
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
      <div className="bg-white rounded-3 shadow-lg" style={{ width: "90%", maxWidth: "900px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <h2 className="h4 mb-0">
            <i className="bi bi-gear-fill me-2"></i>
            Admin Panel - Manage House
          </h2>
          <button onClick={onClose} className="btn-close" aria-label="Close"></button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-fill overflow-auto p-4">
          {/* Minimap Configuration Section */}
          {!editingRoom && (
            <div className="mb-4">
              <h3 className="h5 text-primary border-bottom border-primary pb-2 mb-3">
                <i className="bi bi-map me-2"></i>
                MiniMap Configuration
              </h3>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="enableMinimap"
                  checked={houseData.minimap?.enabled || false}
                  onChange={(e) =>
                    handleUpdateMinimapConfig({
                      ...houseData.minimap,
                      enabled: e.target.checked,
                    })
                  }
                />
                <label className="form-check-label fw-semibold" htmlFor="enableMinimap">
                  Enable MiniMap
                </label>
              </div>

              {houseData.minimap?.enabled && (
                <>
                  <ImageUploader
                    label="Floor Plan Image"
                    currentUrl={houseData.minimap.url || ""}
                    onImageUploaded={(url) =>
                      handleUpdateMinimapConfig({
                        ...houseData.minimap,
                        url,
                      })
                    }
                  />

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Width (px):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={houseData.minimap.width || 400}
                        onChange={(e) =>
                          handleUpdateMinimapConfig({
                            ...houseData.minimap,
                            width: parseInt(e.target.value),
                          })
                        }
                        min="200"
                        max="600"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Height (px):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={houseData.minimap.height || 300}
                        onChange={(e) =>
                          handleUpdateMinimapConfig({
                            ...houseData.minimap,
                            height: parseInt(e.target.value),
                          })
                        }
                        min="200"
                        max="600"
                      />
                    </div>
                  </div>

                  {/* MiniMap Preview with drag-to-position */}
                  {houseData.minimap.url && houseData.rooms.length > 0 && (
                    <div className="p-3 bg-light border rounded">
                      <h4 className="h6 text-secondary mb-3">
                        <i className="bi bi-cursor me-1"></i>
                        Room Positions (Drag to adjust):
                      </h4>
                      <MiniMap
                        minimapConfig={houseData.minimap}
                        rooms={houseData.rooms}
                        currentRoomId={null}
                        onRoomChange={() => {}}
                        isEditMode={true}
                        onUpdateRoomPosition={handleUpdateRoomPosition}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Editing Room Section */}
          {editingRoom && (
            <div className="mb-4">
              <h3 className="h5 text-primary border-bottom border-primary pb-2 mb-3">
                <i className="bi bi-pencil-square me-2"></i>
                Editing: {editingRoom.room_label}
              </h3>

              {!showHotspotEditor ? (
                <div>
                  {/* Room Info Form */}
                  <div className="mb-3">
                    <label className="form-label">Room ID:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingRoom.room_id}
                      disabled
                      style={{ backgroundColor: "#e9ecef" }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Room Label:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingRoom.room_label}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          room_label: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Floor:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editingRoom.floor}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          floor: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* Panorama Image Uploader */}
                  <ImageUploader
                    label="Panorama Image"
                    currentUrl={editingRoom.panorama.url}
                    onImageUploaded={(url) =>
                      setEditingRoom({
                        ...editingRoom,
                        panorama: { ...editingRoom.panorama, url },
                      })
                    }
                  />

                  {/* Hotspots List */}
                  <div className="mb-3">
                    <label className="form-label">
                      Hotspots ({editingRoom.hotspots.length}):
                    </label>
                    <button
                      onClick={() => setShowHotspotEditor(true)}
                      className="btn btn-primary w-100 mb-3"
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Add Hotspot on 3D View
                    </button>

                    <div className="d-flex flex-column gap-2">
                      {editingRoom.hotspots.map((hotspot, index) => (
                        <div key={index} className="card">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <strong>{hotspot.label || "Unnamed"}</strong>
                              <span className="badge bg-success">Link to Room</span>
                            </div>

                            <div className="d-flex gap-2 mb-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Label (e.g., Go to Kitchen)"
                                value={hotspot.label}
                                onChange={(e) =>
                                  handleUpdateHotspot(index, {
                                    ...hotspot,
                                    label: e.target.value,
                                  })
                                }
                              />

                              <select
                                className="form-select form-select-sm"
                                value={hotspot.targetRoom || ""}
                                onChange={(e) => {
                                  const targetRoomId = e.target.value;
                                  const targetRoom = houseData.rooms.find(
                                    (r) => r.room_id === targetRoomId
                                  );
                                  handleUpdateHotspot(index, {
                                    ...hotspot,
                                    targetRoom: targetRoomId,
                                    label: targetRoom
                                      ? `Đi đến ${targetRoom.room_label}`
                                      : "Đi đến...",
                                  });
                                }}
                              >
                                <option value="">-- Select Target Room --</option>
                                {houseData.rooms
                                  .filter((r) => r.room_id !== editingRoom.room_id)
                                  .map((r) => (
                                    <option key={r.room_id} value={r.room_id}>
                                      {r.room_label}
                                    </option>
                                  ))}
                              </select>

                              <button
                                onClick={() => handleRemoveHotspot(index)}
                                className="btn btn-danger btn-sm"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>

                            <div className="small text-muted font-monospace">
                              Pitch: {hotspot.pitch.toFixed(2)}° | Yaw:{" "}
                              {hotspot.yaw.toFixed(2)}°
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      onClick={handleSaveEditedRoom}
                      className="btn btn-primary"
                    >
                      <i className="bi bi-save me-2"></i>
                      Save Room
                    </button>
                    <button
                      onClick={() => setEditingRoom(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : editingRoom ? (
                <div style={{ height: "500px" }}>
                  <HotspotEditor
                    panoramaUrl={editingRoom.panorama.url}
                    existingHotspots={editingRoom.hotspots}
                    onAddHotspot={handleAddHotspot}
                    onRemoveHotspot={handleRemoveHotspot}
                  />
                  <button
                    onClick={() => setShowHotspotEditor(false)}
                    className="btn btn-secondary mt-2"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Form
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Add New Room Section */}
          {!editingRoom && (
            <>
              <div className="mb-4">
                <h3 className="h5 text-primary border-bottom border-primary pb-2 mb-3">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Room
                </h3>

                <div className="mb-3">
                  <label className="form-label">Room ID:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., living_room"
                    value={newRoom.room_id}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, room_id: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Room Label:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Living Room"
                    value={newRoom.room_label}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, room_label: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Floor:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newRoom.floor}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        floor: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Panorama Image Uploader */}
                <ImageUploader
                  label="Panorama Image"
                  currentUrl={newRoom.panorama.url}
                  onImageUploaded={(url) =>
                    setNewRoom({
                      ...newRoom,
                      panorama: { ...newRoom.panorama, url },
                    })
                  }
                />

                <button onClick={handleAddRoom} className="btn btn-primary w-100">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Room
                </button>
              </div>

              {/* Existing Rooms List */}
              <div className="mb-4">
                <h3 className="h5 text-primary border-bottom border-primary pb-2 mb-3">
                  <i className="bi bi-list-ul me-2"></i>
                  Existing Rooms ({houseData.rooms.length})
                </h3>

                <div className="row g-3">
                  {houseData.rooms.map((room) => (
                    <div key={room.room_id} className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h5 className="card-title h6 mb-1">{room.room_label}</h5>
                              <small className="text-muted">({room.room_id})</small>
                            </div>
                            <span className="badge bg-primary">Floor {room.floor}</span>
                          </div>

                          <p className="card-text small text-muted mb-3">
                            {room.hotspots.length} hotspot(s)
                          </p>

                          <div className="d-flex gap-2">
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="btn btn-success btn-sm"
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.room_id)}
                              className="btn btn-danger btn-sm"
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
