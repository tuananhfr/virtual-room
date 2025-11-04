import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Controls {
  isUserInteracting: boolean;
  onPointerDownMouseX: number;
  onPointerDownMouseY: number;
  lon: number;
  onPointerDownLon: number;
  lat: number;
  onPointerDownLat: number;
  phi: number;
  theta: number;
  hasMoved: boolean;
}

// Extend CanvasRenderingContext2D to include roundRect method
interface CanvasRenderingContext2DExtended extends CanvasRenderingContext2D {
  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ): void;
}

/**
 * Component hiển thị panorama 360° bằng Three.js
 */
const PanoramaViewer = ({
  panoramaUrl,
  hotspots = [],
  onHotspotClick,
  roomLabel,
}: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<Controls | null>(null);
  const hotspotsRef = useRef<THREE.Object3D[]>([]);

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

    // Initialize renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap pixel ratio at 2 for better performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere for panorama with reduced segments for better performance
    const geometry = new THREE.SphereGeometry(500, 32, 24); // Reduced from 60, 40
    geometry.scale(-1, 1, 1); // Flip inside out

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    let panoramaSphere: THREE.Mesh | null = null;

    textureLoader.load(
      panoramaUrl,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        panoramaSphere = new THREE.Mesh(geometry, material);
        scene.add(panoramaSphere);
      },
      undefined,
      (error) => {
        console.error("Error loading panorama:", error);
      }
    );

    // Function to add hotspots to scene
    const addHotspots = (scene: THREE.Scene, hotspots: Hotspot[]) => {
      // Clear old hotspots
      hotspotsRef.current.forEach((hotspot) => {
        scene.remove(hotspot);
      });
      hotspotsRef.current = [];

      hotspots.forEach((hotspot) => {
        // Create hotspot marker with reduced segments for performance
        const geometry = new THREE.SphereGeometry(15, 16, 12); // Reduced from 32, 32
        const color = 0x00ff00; // Always green for links

        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.8,
        });
        const sphere = new THREE.Mesh(geometry, material);

        // Calculate position from pitch and yaw
        const pitch = THREE.MathUtils.degToRad(hotspot.pitch || 0);
        const yaw = THREE.MathUtils.degToRad(hotspot.yaw || 0);
        const radius = 400;

        const x = radius * Math.cos(pitch) * Math.sin(yaw);
        const y = radius * Math.sin(pitch);
        const z = radius * Math.cos(pitch) * Math.cos(yaw);

        sphere.position.set(x, y, z);

        sphere.userData.hotspot = hotspot;

        // Add text label using canvas texture
        if (hotspot.label) {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext(
            "2d"
          ) as CanvasRenderingContext2DExtended | null;
          if (!context) return;

          canvas.width = 512;
          canvas.height = 128;

          // Background
          context.fillStyle = "rgba(0, 0, 0, 0.7)";
          context.roundRect(0, 0, canvas.width, canvas.height, 20);
          context.fill();

          // Text
          context.fillStyle = "white";
          context.font = "bold 48px Arial";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(hotspot.label, canvas.width / 2, canvas.height / 2);

          const texture = new THREE.CanvasTexture(canvas);
          const labelMaterial = new THREE.SpriteMaterial({ map: texture });
          const labelSprite = new THREE.Sprite(labelMaterial);

          // Position label slightly offset from hotspot
          labelSprite.position.set(x, y + 25, z);
          labelSprite.scale.set(50, 12.5, 1);
          labelSprite.userData.hotspot = hotspot;

          scene.add(labelSprite);
          hotspotsRef.current.push(labelSprite);
        }

        scene.add(sphere);
        hotspotsRef.current.push(sphere);
      });
    };

    // Add hotspots
    addHotspots(scene, hotspots);

    // Mouse controls using spherical coordinates (lon/lat)
    const controls = {
      isUserInteracting: false,
      onPointerDownMouseX: 0,
      onPointerDownMouseY: 0,
      lon: 0,
      onPointerDownLon: 0,
      lat: 0,
      onPointerDownLat: 0,
      phi: 0,
      theta: 0,
      hasMoved: false,
    };
    controlsRef.current = controls;

    // Click handler for hotspots
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastHoverCheck = 0;
    const HOVER_CHECK_THROTTLE = 50; // ms

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;

      controls.isUserInteracting = true;
      controls.hasMoved = false;
      controls.onPointerDownMouseX = event.clientX;
      controls.onPointerDownMouseY = event.clientY;
      controls.onPointerDownLon = controls.lon;
      controls.onPointerDownLat = controls.lat;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.isPrimary === false) return;

      if (controls.isUserInteracting) {
        const deltaX = event.clientX - controls.onPointerDownMouseX;
        const deltaY = event.clientY - controls.onPointerDownMouseY;

        // Đánh dấu đã move nếu di chuyển > 5px
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          controls.hasMoved = true;
        }

        controls.lon =
          (controls.onPointerDownMouseX - event.clientX) * 0.1 +
          controls.onPointerDownLon;
        controls.lat =
          (event.clientY - controls.onPointerDownMouseY) * 0.1 +
          controls.onPointerDownLat;
      } else {
        // Throttle hover check for better performance
        const now = Date.now();
        if (now - lastHoverCheck > HOVER_CHECK_THROTTLE) {
          lastHoverCheck = now;

          // Check if hovering over hotspot to change cursor
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(hotspotsRef.current);

          if (intersects.length > 0) {
            renderer.domElement.style.cursor = "pointer";
          } else {
            renderer.domElement.style.cursor = "grab";
          }
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      controls.isUserInteracting = false;
    };

    // Mouse wheel for zoom
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
      camera.updateProjectionMatrix();
    };

    // Touch controls for mobile (using spherical coordinates)
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        controls.isUserInteracting = true;
        controls.hasMoved = false;
        controls.onPointerDownMouseX = event.touches[0].clientX;
        controls.onPointerDownMouseY = event.touches[0].clientY;
        controls.onPointerDownLon = controls.lon;
        controls.onPointerDownLat = controls.lat;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!controls.isUserInteracting || event.touches.length !== 1) return;

      const deltaX = event.touches[0].clientX - controls.onPointerDownMouseX;
      const deltaY = event.touches[0].clientY - controls.onPointerDownMouseY;

      // Đánh dấu đã move nếu di chuyển > 5px
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        controls.hasMoved = true;
      }

      controls.lon = (controls.onPointerDownMouseX - event.touches[0].clientX) * 0.1 + controls.onPointerDownLon;
      controls.lat = (event.touches[0].clientY - controls.onPointerDownMouseY) * 0.1 + controls.onPointerDownLat;
    };

    const onTouchEnd = () => {
      controls.isUserInteracting = false;
    };

    const onClick = (event: MouseEvent) => {
      // Không trigger click nếu vừa drag
      if (controls.hasMoved) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotsRef.current);

      if (intersects.length > 0) {
        const hotspot = intersects[0].object.userData.hotspot as Hotspot;
        if (hotspot && onHotspotClick) {
          onHotspotClick(hotspot);
        }
      }
    };

    // Attach events to canvas
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchmove", onTouchMove, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchend", onTouchEnd);

    // Handle window resize
    const onWindowResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", onWindowResize);

    // Animation loop with spherical coordinates
    const animate = () => {
      requestAnimationFrame(animate);

      // Limit latitude
      controls.lat = Math.max(-85, Math.min(85, controls.lat));

      // Convert to spherical coordinates
      controls.phi = THREE.MathUtils.degToRad(90 - controls.lat);
      controls.theta = THREE.MathUtils.degToRad(controls.lon);

      // Calculate target position
      const x = 500 * Math.sin(controls.phi) * Math.cos(controls.theta);
      const y = 500 * Math.cos(controls.phi);
      const z = 500 * Math.sin(controls.phi) * Math.sin(controls.theta);

      camera.lookAt(x, y, z);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);

      // Dispose panorama sphere
      if (panoramaSphere) {
        if (panoramaSphere.material) {
          if (Array.isArray(panoramaSphere.material)) {
            panoramaSphere.material.forEach((mat) => {
              const material = mat as THREE.MeshBasicMaterial;
              if (material.map) material.map.dispose();
              mat.dispose();
            });
          } else {
            const material = panoramaSphere.material as THREE.MeshBasicMaterial;
            if (material.map) material.map.dispose();
            material.dispose();
          }
        }
        if (panoramaSphere.geometry) panoramaSphere.geometry.dispose();
        scene.remove(panoramaSphere);
      }

      // Dispose geometry
      geometry.dispose();

      if (
        container &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [panoramaUrl, hotspots, onHotspotClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        cursor: "grab",
      }}
    >
      {/* Room Label Overlay - Top Center */}
      {roomLabel && (
        <div
          className="position-absolute top-0 start-50 translate-middle-x mt-2"
          style={{ zIndex: 100, pointerEvents: "none" }}
        >
          <div className="bg-dark bg-opacity-75 text-white px-4 py-1 rounded-pill shadow-lg">
            <h5 className="mb-1 fw-semibold">{roomLabel}</h5>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanoramaViewer;
