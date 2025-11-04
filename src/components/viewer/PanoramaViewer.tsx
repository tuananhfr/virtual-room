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
  isAnimating: boolean;
  targetLon: number;
  targetLat: number;
  animationCallback?: () => void;
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

// Function to add/update hotspots in scene (outside component to avoid recreating)
const addHotspots = (
  scene: THREE.Scene,
  hotspots: Hotspot[],
  hotspotsRef: React.MutableRefObject<THREE.Object3D[]>
) => {
  // Clear old hotspots
  hotspotsRef.current.forEach((hotspot) => {
    scene.remove(hotspot);
  });
  hotspotsRef.current = [];

  hotspots.forEach((hotspot) => {
    // Calculate position from pitch and yaw
    const pitch = THREE.MathUtils.degToRad(hotspot.pitch || 0);
    const yaw = THREE.MathUtils.degToRad(hotspot.yaw || 0);
    const radius = 400;

    const x = radius * Math.cos(pitch) * Math.sin(yaw);
    const y = radius * Math.sin(pitch);
    const z = radius * Math.cos(pitch) * Math.cos(yaw);

    // Create icon hotspot marker using canvas with Bootstrap icon
    const iconCanvas = document.createElement("canvas");
    const iconContext = iconCanvas.getContext("2d");
    if (!iconContext) return;

    iconCanvas.width = 256;
    iconCanvas.height = 256;

    // Draw arrow-up-circle icon (Bootstrap outline-primary style)
    const primaryColor = "black"; // Bootstrap primary color

    // Draw circle background (slightly filled for better visibility)
    iconContext.fillStyle = "gray";
    iconContext.beginPath();
    iconContext.arc(128, 128, 110, 0, Math.PI * 2);
    iconContext.fill();

    // Draw circle outline
    iconContext.strokeStyle = primaryColor;
    iconContext.lineWidth = 12;
    iconContext.beginPath();
    iconContext.arc(128, 128, 110, 0, Math.PI * 2);
    iconContext.stroke();

    // Draw arrow up
    iconContext.strokeStyle = primaryColor;
    iconContext.lineWidth = 12;
    iconContext.lineCap = "round";
    iconContext.lineJoin = "round";

    // Arrow shaft
    iconContext.beginPath();
    iconContext.moveTo(128, 180);
    iconContext.lineTo(128, 80);
    iconContext.stroke();

    // Arrow head
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
    iconSprite.scale.set(40, 40, 1); // Larger icon
    iconSprite.userData.hotspot = hotspot;
    iconSprite.userData.isIcon = true; // Mark as icon for hover effect
    iconSprite.userData.basePosition = { x, y, z }; // Store base position

    scene.add(iconSprite);
    hotspotsRef.current.push(iconSprite);

    // Add text label using canvas texture
    if (hotspot.label) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2DExtended | null;
      if (!context) return;

      // Measure text to calculate proper canvas size
      context.font = "bold 64px Arial";
      const textMetrics = context.measureText(hotspot.label);
      const textWidth = textMetrics.width;
      const padding = 40; // Padding around text
      const borderRadius = 20;

      canvas.width = textWidth + padding * 2;
      canvas.height = 160;

      // Re-set font after canvas resize
      context.font = "bold 64px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";

      // Background with rounded corners
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.roundRect(0, 0, canvas.width, canvas.height, borderRadius);
      context.fill();

      // Text
      context.fillStyle = "white";
      context.fillText(hotspot.label, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: texture });
      const labelSprite = new THREE.Sprite(labelMaterial);

      // Calculate aspect ratio for proper scaling
      const aspectRatio = canvas.width / canvas.height;
      const labelHeight = 17.5;
      const labelWidth = labelHeight * aspectRatio;

      // Position label below icon
      labelSprite.position.set(x, y - 30, z);
      labelSprite.scale.set(labelWidth, labelHeight, 1);
      labelSprite.userData.hotspot = hotspot;
      labelSprite.userData.baseYOffset = -30; // Store base offset

      // Link label to icon for hover effect
      iconSprite.userData.labelSprite = labelSprite;

      scene.add(labelSprite);
      hotspotsRef.current.push(labelSprite);
    }
  });
};

/**
 * Component hiển thị panorama 360° bằng Three.js
 */
const PanoramaViewer = ({
  panoramaUrl,
  hotspots = [],
  onHotspotClick,
  roomLabel,
  triggerHotspot,
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

    // Note: Hotspots are added in a separate useEffect to avoid recreating scene

    // Mouse controls using spherical coordinates (lon/lat)
    const controls: Controls = {
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
      isAnimating: false,
      targetLon: 0,
      targetLat: 0,
    };
    controlsRef.current = controls;

    // Click handler for hotspots
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let lastHoverCheck = 0;
    const HOVER_CHECK_THROTTLE = 50; // ms
    let hoveredHotspot: THREE.Object3D | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;

      controls.isUserInteracting = true;
      controls.hasMoved = false;
      controls.onPointerDownMouseX = event.clientX;
      controls.onPointerDownMouseY = event.clientY;
      controls.onPointerDownLon = controls.lon;
      controls.onPointerDownLat = controls.lat;

      renderer.domElement.style.cursor = "grabbing";
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

          // Check if hovering over hotspot to change cursor and scale
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(hotspotsRef.current);

          if (intersects.length > 0) {
            renderer.domElement.style.cursor = "pointer";

            // Find the icon sprite (not label) in intersects
            const iconIntersect = intersects.find(
              (i) => i.object.userData.isIcon
            );
            const newHovered = iconIntersect ? iconIntersect.object : null;

            if (newHovered && newHovered !== hoveredHotspot) {
              // Reset previous hovered icon
              if (hoveredHotspot && hoveredHotspot instanceof THREE.Sprite) {
                hoveredHotspot.scale.set(40, 40, 1);
                // Reset label position
                const prevLabel = hoveredHotspot.userData.labelSprite;
                if (prevLabel && prevLabel instanceof THREE.Sprite) {
                  const pos = hoveredHotspot.userData.basePosition;
                  prevLabel.position.y = pos.y - 30;
                }
              }
              // Scale up new hovered icon
              if (newHovered instanceof THREE.Sprite) {
                newHovered.scale.set(50, 50, 1); // 25% larger
                // Push label down to avoid overlap
                const label = newHovered.userData.labelSprite;
                if (label && label instanceof THREE.Sprite) {
                  const pos = newHovered.userData.basePosition;
                  label.position.y = pos.y - 35; // Push down 5 units more
                }
              }
              hoveredHotspot = newHovered;
            }
          } else {
            renderer.domElement.style.cursor = "grab";

            // Reset hovered icon scale
            if (hoveredHotspot && hoveredHotspot instanceof THREE.Sprite) {
              hoveredHotspot.scale.set(40, 40, 1);
              // Reset label position
              const label = hoveredHotspot.userData.labelSprite;
              if (label && label instanceof THREE.Sprite) {
                const pos = hoveredHotspot.userData.basePosition;
                label.position.y = pos.y - 30;
              }
              hoveredHotspot = null;
            }
          }
        }
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      controls.isUserInteracting = false;

      renderer.domElement.style.cursor = "grab";
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

      controls.lon =
        (controls.onPointerDownMouseX - event.touches[0].clientX) * 0.1 +
        controls.onPointerDownLon;
      controls.lat =
        (event.touches[0].clientY - controls.onPointerDownMouseY) * 0.1 +
        controls.onPointerDownLat;
    };

    const onTouchEnd = () => {
      controls.isUserInteracting = false;
    };

    const onClick = (event: MouseEvent) => {
      // Không trigger click nếu vừa drag hoặc đang animate
      if (controls.hasMoved || controls.isAnimating) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotsRef.current);

      if (intersects.length > 0) {
        const hotspot = intersects[0].object.userData.hotspot as Hotspot;
        if (hotspot && onHotspotClick) {
          // Rotate camera to look directly at the hotspot
          // Get hotspot 3D position
          const pitch = THREE.MathUtils.degToRad(hotspot.pitch || 0);
          const yaw = THREE.MathUtils.degToRad(hotspot.yaw || 0);

          // Hotspot position in 3D space
          const hotspotX = Math.cos(pitch) * Math.sin(yaw);
          const hotspotY = Math.sin(pitch);
          const hotspotZ = Math.cos(pitch) * Math.cos(yaw);

          // Convert 3D position back to lon/lat for camera
          // lon = atan2(z, x) -> horizontal angle
          // lat = asin(y) -> vertical angle
          const targetLon = THREE.MathUtils.radToDeg(
            Math.atan2(hotspotZ, hotspotX)
          );
          const targetLat = THREE.MathUtils.radToDeg(Math.asin(hotspotY));

          controls.isAnimating = true;
          controls.targetLon = targetLon;
          controls.targetLat = targetLat;
          controls.animationCallback = () => {
            onHotspotClick(hotspot);
          };
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

      // Handle smooth rotation animation to hotspot
      if (controls.isAnimating && !controls.isUserInteracting) {
        const speed = 0.05; // Animation speed (0-1, higher = faster)
        const threshold = 0.5; // Stop threshold in degrees

        // Calculate difference between current and target
        let lonDiff = controls.targetLon - controls.lon;
        let latDiff = controls.targetLat - controls.lat;

        // Normalize longitude difference to shortest path (-180 to 180)
        while (lonDiff > 180) lonDiff -= 360;
        while (lonDiff < -180) lonDiff += 360;

        // Check if we're close enough to target
        if (Math.abs(lonDiff) < threshold && Math.abs(latDiff) < threshold) {
          // Animation complete
          controls.lon = controls.targetLon;
          controls.lat = controls.targetLat;
          controls.isAnimating = false;

          // Execute callback (navigate to room)
          if (controls.animationCallback) {
            const callback = controls.animationCallback;
            callback();
            controls.animationCallback = undefined;
          }
        } else {
          // Smoothly interpolate towards target
          controls.lon += lonDiff * speed;
          controls.lat += latDiff * speed;
        }
      }

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
  }, [panoramaUrl]); // Only recreate scene when panoramaUrl changes

  // Separate effect to update hotspots without recreating the entire scene
  useEffect(() => {
    if (!sceneRef.current) return;
    addHotspots(sceneRef.current, hotspots, hotspotsRef);
  }, [hotspots]); // Only update hotspots when they change

  // Handle external hotspot trigger (from minimap)
  useEffect(() => {
    if (triggerHotspot && controlsRef.current) {
      const controls = controlsRef.current;

      // Get hotspot 3D position
      const pitch = THREE.MathUtils.degToRad(triggerHotspot.pitch || 0);
      const yaw = THREE.MathUtils.degToRad(triggerHotspot.yaw || 0);

      // Hotspot position in 3D space
      const hotspotX = Math.cos(pitch) * Math.sin(yaw);
      const hotspotY = Math.sin(pitch);
      const hotspotZ = Math.cos(pitch) * Math.cos(yaw);

      // Convert 3D position back to lon/lat for camera
      const targetLon = THREE.MathUtils.radToDeg(
        Math.atan2(hotspotZ, hotspotX)
      );
      const targetLat = THREE.MathUtils.radToDeg(Math.asin(hotspotY));

      // Set animation target to look at the hotspot
      controls.isAnimating = true;
      controls.targetLon = targetLon;
      controls.targetLat = targetLat;
      controls.animationCallback = () => {
        onHotspotClick(triggerHotspot);
      };
    }
  }, [triggerHotspot, onHotspotClick]);

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
