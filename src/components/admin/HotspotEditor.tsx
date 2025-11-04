import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HotspotEditorProps {
  panoramaUrl: string;
  existingHotspots?: Hotspot[];
  onAddHotspot: (position: { pitch: number; yaw: number }) => void;
  onRemoveHotspot: (index: number) => void;
  onUpdateHotspot?: (index: number, updatedHotspot: Hotspot) => void;
  availableRooms?: Room[];
}

interface MouseControls {
  isMouseDown: boolean;
  previousMousePosition: { x: number; y: number };
  rotation: { x: number; y: number };
  hasMoved: boolean;
}

/**
 * Component để click chọn vị trí hotspot trên panorama 3D
 */
const HotspotEditor: React.FC<HotspotEditorProps> = ({
  panoramaUrl,
  existingHotspots = [],
  onAddHotspot,
  onRemoveHotspot,
  onUpdateHotspot,
  availableRooms = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<MouseControls | null>(null);
  const hotspotsRef = useRef<THREE.Object3D[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<{
    hotspot: Hotspot;
    index: number;
  } | null>(null);
  const previousHotspotCountRef = useRef<number>(existingHotspots.length);

  // Auto-select newly added hotspot
  useEffect(() => {
    if (existingHotspots.length > previousHotspotCountRef.current) {
      // A new hotspot was added, select it
      const newIndex = existingHotspots.length - 1;
      const newHotspot = existingHotspots[newIndex];
      setSelectedHotspot({
        hotspot: newHotspot,
        index: newIndex,
      });
    }
    previousHotspotCountRef.current = existingHotspots.length;
  }, [existingHotspots.length]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Copy ref to local variable for cleanup
    const container = containerRef.current;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    // Initialize renderer with optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere for panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      panoramaUrl,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
      },
      undefined,
      (error) => {
        console.error("Error loading panorama:", error);
      }
    );

    // Add existing hotspots
    updateHotspots(scene, existingHotspots);

    // Mouse controls
    const controls = {
      isMouseDown: false,
      previousMousePosition: { x: 0, y: 0 },
      rotation: { x: 0, y: 0 },
      hasMoved: false,
    };
    controlsRef.current = controls;

    const onMouseDown = (event: MouseEvent) => {
      controls.isMouseDown = true;
      controls.hasMoved = false;
      controls.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onMouseUp = () => {
      controls.isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (controls.isMouseDown) {
        const deltaX = event.clientX - controls.previousMousePosition.x;
        const deltaY = event.clientY - controls.previousMousePosition.y;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          controls.hasMoved = true;
        }

        controls.rotation.y += deltaX * 0.003;
        controls.rotation.x += deltaY * 0.003;
        controls.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, controls.rotation.x)
        );

        controls.previousMousePosition = {
          x: event.clientX,
          y: event.clientY,
        };
      }
    };

    // Click handler - Add new hotspot or select existing
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (controls.hasMoved) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check if clicking existing hotspot
      const hotspotIntersects = raycaster.intersectObjects(hotspotsRef.current);
      if (hotspotIntersects.length > 0) {
        const data = hotspotIntersects[0].object.userData.hotspot as Hotspot & {
          index: number;
        };
        setSelectedHotspot({ hotspot: data, index: data.index });
        return;
      }

      // Otherwise, create new hotspot at clicked position
      const sphereIntersects = raycaster.intersectObjects(
        scene.children.filter(
          (obj) => (obj as THREE.Mesh).geometry?.type === "SphereGeometry"
        )
      );
      if (sphereIntersects.length > 0) {
        const point = sphereIntersects[0].point;

        // Convert 3D position to pitch/yaw
        const distance = Math.sqrt(
          point.x * point.x + point.y * point.y + point.z * point.z
        );
        const pitch = THREE.MathUtils.radToDeg(Math.asin(point.y / distance));
        const yaw = THREE.MathUtils.radToDeg(Math.atan2(point.x, point.z));

        if (onAddHotspot) {
          onAddHotspot({ pitch, yaw });
          // The useEffect hook will auto-select the newly added hotspot
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    // Handle window resize
    const onWindowResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onWindowResize);

    // Animation loop - continuous rendering
    const animate = () => {
      requestAnimationFrame(animate);

      camera.rotation.order = "YXZ";
      camera.rotation.y = controls.rotation.y;
      camera.rotation.x = controls.rotation.x;

      hotspotsRef.current.forEach((hotspot) => {
        if (hotspot instanceof THREE.Mesh) {
          hotspot.lookAt(camera.position);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);

      if (
        container &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [panoramaUrl, existingHotspots, onAddHotspot]);

  // Function to update hotspots visualization
  const updateHotspots = (scene: THREE.Scene, hotspots: Hotspot[]) => {
    hotspotsRef.current.forEach((hotspot) => {
      scene.remove(hotspot);
    });
    hotspotsRef.current = [];

    hotspots.forEach((hotspot, index) => {
      // Calculate position from pitch and yaw
      const pitch = THREE.MathUtils.degToRad(hotspot.pitch || 0);
      const yaw = THREE.MathUtils.degToRad(hotspot.yaw || 0);
      const radius = 400;

      const x = radius * Math.cos(pitch) * Math.sin(yaw);
      const y = radius * Math.sin(pitch);
      const z = radius * Math.cos(pitch) * Math.cos(yaw);

      // Create icon hotspot marker using canvas like in viewer
      const iconCanvas = document.createElement("canvas");
      const iconContext = iconCanvas.getContext("2d");
      if (!iconContext) return;

      iconCanvas.width = 256;
      iconCanvas.height = 256;

      const primaryColor = "black";

      // Background circle (slightly filled)
      iconContext.fillStyle = "gray";
      iconContext.beginPath();
      iconContext.arc(128, 128, 110, 0, Math.PI * 2);
      iconContext.fill();

      // Circle outline
      iconContext.strokeStyle = primaryColor;
      iconContext.lineWidth = 12;
      iconContext.beginPath();
      iconContext.arc(128, 128, 110, 0, Math.PI * 2);
      iconContext.stroke();

      // Arrow up
      iconContext.strokeStyle = primaryColor;
      iconContext.lineWidth = 12;
      iconContext.lineCap = "round";
      iconContext.lineJoin = "round";

      // Shaft
      iconContext.beginPath();
      iconContext.moveTo(128, 180);
      iconContext.lineTo(128, 80);
      iconContext.stroke();

      // Head
      iconContext.beginPath();
      iconContext.moveTo(128, 80);
      iconContext.lineTo(90, 118);
      iconContext.stroke();
      iconContext.beginPath();
      iconContext.moveTo(128, 80);
      iconContext.lineTo(166, 118);
      iconContext.stroke();

      const iconTexture = new THREE.CanvasTexture(iconCanvas);
      const iconMaterial = new THREE.SpriteMaterial({
        map: iconTexture,
        transparent: true,
      });
      const iconSprite = new THREE.Sprite(iconMaterial);
      iconSprite.position.set(x, y, z);
      iconSprite.scale.set(40, 40, 1);
      iconSprite.userData.hotspot = { ...hotspot, index };
      iconSprite.userData.isIcon = true;
      iconSprite.userData.basePosition = { x, y, z };
      scene.add(iconSprite);
      hotspotsRef.current.push(iconSprite);

      // Add text label
      if (hotspot.label) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext(
          "2d"
        ) as CanvasRenderingContext2D | null;
        if (!context) return;

        context.font = "bold 64px Arial";
        const textMetrics = context.measureText(hotspot.label);
        const textWidth = textMetrics.width;
        const padding = 40;
        const borderRadius = 20;

        canvas.width = textWidth + padding * 2;
        canvas.height = 160;

        // Re-set font after resize
        context.font = "bold 64px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";

        // Background rounded rect
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        // Fallback rounded rect path
        const w = canvas.width,
          h = canvas.height,
          r = borderRadius;
        context.beginPath();
        context.moveTo(r, 0);
        context.lineTo(w - r, 0);
        context.quadraticCurveTo(w, 0, w, r);
        context.lineTo(w, h - r);
        context.quadraticCurveTo(w, h, w - r, h);
        context.lineTo(r, h);
        context.quadraticCurveTo(0, h, 0, h - r);
        context.lineTo(0, r);
        context.quadraticCurveTo(0, 0, r, 0);
        context.closePath();
        context.fill();

        // Text
        context.fillStyle = "white";
        context.fillText(hotspot.label, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        });
        const labelSprite = new THREE.Sprite(labelMaterial);

        const aspectRatio = canvas.width / canvas.height;
        const labelHeight = 17.5;
        const labelWidth = labelHeight * aspectRatio;

        labelSprite.position.set(x, y - 30, z);
        labelSprite.scale.set(labelWidth, labelHeight, 1);
        labelSprite.userData.hotspot = { ...hotspot, index };
        labelSprite.userData.baseYOffset = -30;
        iconSprite.userData.labelSprite = labelSprite;

        scene.add(labelSprite);
        hotspotsRef.current.push(labelSprite);
      }
    });
  };

  return (
    <div className="position-relative w-100 h-100">
      <div
        ref={containerRef}
        className="w-100 h-100"
        style={{ cursor: "crosshair" }}
      />

      {/* Instructions */}
      <div
        className="position-absolute bottom-0 start-50 translate-middle-x mb-3 bg-dark bg-opacity-75 text-white px-3 py-2 rounded"
        style={{ pointerEvents: "none" }}
      >
        <i className="bi bi-mouse me-2"></i>
        Click anywhere to add hotspot | Click existing hotspot to select
      </div>

      {/* Selected hotspot edit form */}
      {selectedHotspot && (
        <div
          className="position-absolute top-0 end-0 m-3 bg-white shadow-lg rounded p-3"
          style={{ minWidth: "350px" }}
        >
          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Hotspot Label:
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g., Go to Kitchen"
              value={selectedHotspot.hotspot.label}
              onChange={(e) => {
                if (onUpdateHotspot) {
                  onUpdateHotspot(selectedHotspot.index, {
                    ...selectedHotspot.hotspot,
                    label: e.target.value,
                  });
                  setSelectedHotspot({
                    ...selectedHotspot,
                    hotspot: {
                      ...selectedHotspot.hotspot,
                      label: e.target.value,
                    },
                  });
                }
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">Target Room:</label>
            <select
              className="form-select form-select-sm"
              value={selectedHotspot.hotspot.targetRoom || ""}
              onChange={(e) => {
                const targetRoomId = e.target.value;
                const targetRoom = availableRooms.find(
                  (r) => r.room_id === targetRoomId
                );
                if (onUpdateHotspot) {
                  onUpdateHotspot(selectedHotspot.index, {
                    ...selectedHotspot.hotspot,
                    targetRoom: targetRoomId,
                    label: targetRoom
                      ? `Go to ${targetRoom.room_label}`
                      : selectedHotspot.hotspot.label,
                  });
                  setSelectedHotspot({
                    ...selectedHotspot,
                    hotspot: {
                      ...selectedHotspot.hotspot,
                      targetRoom: targetRoomId,
                      label: targetRoom
                        ? `Go to ${targetRoom.room_label}`
                        : selectedHotspot.hotspot.label,
                    },
                  });
                }
              }}
            >
              <option value="">-- Select Target Room --</option>
              {availableRooms.map((room) => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_label}
                </option>
              ))}
            </select>
          </div>

          <div className="small text-muted mb-3">
            <i className="bi bi-geo-alt me-1"></i>
            Pitch: {selectedHotspot.hotspot.pitch.toFixed(2)}° | Yaw:{" "}
            {selectedHotspot.hotspot.yaw.toFixed(2)}°
          </div>

          <div className="d-flex gap-2">
            <button
              onClick={() => setSelectedHotspot(null)}
              className="btn btn-secondary btn-sm flex-fill"
            >
              <i className="bi bi-check me-1"></i>
              Done
            </button>
            <button
              onClick={() => {
                if (onRemoveHotspot) {
                  onRemoveHotspot(selectedHotspot.index);
                  setSelectedHotspot(null);
                }
              }}
              className="btn btn-danger btn-sm"
            >
              <i className="bi bi-trash me-1"></i>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotEditor;
