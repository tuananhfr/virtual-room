# Virtual Room Tour Builder

An interactive web application for creating and managing 360° panoramic room tours. Users can explore 3D spaces with smooth animations and intuitive navigation.

**Live Demo:** [virtual-room-two.vercel.app](https://virtual-room-two.vercel.app)

## Features

### 360° Panorama Viewer

- Display 360° panorama images using Three.js
- Mouse/touch controls to rotate camera
- Zoom in/out with mouse wheel
- Responsive support on mobile and desktop

### Hotspots & Navigation

- Add hotspots on panorama to link between rooms
- Smooth animations when switching rooms (dolly-in/out effect)
- Automatically rotate camera to hotspot before transitioning
- Vignette and FOV transition effects

### MiniMap

- Display floor plan with room markers
- Click markers to quickly switch rooms
- Hide/show minimap with animation
- Zoom and pan support on minimap

### Admin Panel

- **Room Management:**

  - Add/edit/delete rooms
  - Upload panorama images (local or URL)
  - Preview images in room list
  - Manage room information (ID, Label, Floor)

- **Hotspot Management:**

  - Click on 3D panorama to place hotspots
  - Link hotspots to other rooms
  - Edit hotspot labels and positions
  - Delete hotspots

- **MiniMap Management:**
  - Upload floor plan images
  - Position rooms on minimap (drag and drop)
  - Configure size and floor number

## Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **3D Rendering:** Three.js
- **UI Framework:** Bootstrap 5.3 + Bootstrap Icons
- **Build Tool:** Vite
- **State Management:** React Hooks

## Installation

### Requirements

- Node.js >= 18
- npm or yarn

### Installation Steps

1. Clone repository:

```bash
git clone https://github.com/your-username/virtual-room.git
cd virtual-room
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview build:

```bash
npm run preview
```

## Usage Guide

### Creating a New Tour

1. **Open Admin Mode:**

   - Click "Admin Mode" button in header
   - Or click "Open Admin Mode" if no rooms exist

2. **Add MiniMap (optional):**

   - Scroll to "Minimap Configuration" section
   - Upload floor plan image
   - Set minimap size (width, height)
   - Select floor number

3. **Add Rooms:**

   - Enter Room ID (e.g., `living_room`)
   - Enter Room Label (e.g., `Living Room`)
   - Upload 360° panorama image
   - Click "Add Room"

4. **Add Hotspots:**

   - After having at least 2 rooms, click "Add Hotspot on 3D View"
   - Click on panorama to place hotspot
   - Select target room from dropdown
   - Enter hotspot label (e.g., `Go to Kitchen`)
   - Click "Save" to save hotspot

5. **Edit Room:**
   - Click "Edit" on room card in "Existing Rooms"
   - Edit room information
   - Add/edit/delete hotspots
   - Click "Save Room" to save

### Navigation in Tour

- **View panorama:** Drag mouse or touch to rotate camera
- **Zoom:** Scroll mouse wheel to zoom in/out
- **Switch room:** Click hotspot on panorama
- **Switch room from minimap:** Click room marker on minimap
- **Hide/show minimap:** Click arrow button next to minimap

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminPanel.tsx      # Main admin panel
│   │   └── HotspotEditor.tsx   # Hotspot placement and editing
│   ├── common/
│   │   ├── ImageUploader.tsx   # Image upload component
│   │   └── MiniMap.tsx         # Minimap display component
│   └── viewer/
│       └── PanoramaViewer.tsx   # 360° panorama viewer
├── hooks/
│   └── useHouseData.ts         # House tour data management hook
├── types/
│   └── index.ts                # TypeScript type definitions
├── data/
│   └── mockData.ts             # Sample data
├── App.tsx                     # Main component
└── main.tsx                    # Entry point
```

## Animation Features

### Dolly-in/out Effect

When switching rooms, the camera will:

1. Smoothly rotate towards hotspot
2. Dolly-out (zoom in + increasing vignette)
3. Transition to new panorama
4. Entry animation (zoom out + fading vignette) when entering new room

### Easing Functions

- **Rotation:** Linear interpolation with speed control
- **FOV Transition:** Ease-in-out cubic
- **Vignette:** Smooth fade in/out

## JSON Data Format

```json
{
  "houseName": "My 3D House Tour",
  "description": "Description here",
  "minimap": {
    "url": "https://example.com/minimap.jpg",
    "width": 200,
    "height": 150,
    "floor": 1
  },
  "rooms": [
    {
      "room_id": "living_room",
      "room_label": "Living Room",
      "floor": 1,
      "panorama": {
        "url": "https://example.com/panorama.jpg"
      },
      "hotspots": [
        {
          "id": "hs_1234567890",
          "pitch": 0,
          "yaw": 90,
          "type": "link",
          "label": "Go to Kitchen",
          "targetRoom": "kitchen"
        }
      ],
      "minimapPosition": {
        "x": 50,
        "y": 50
      }
    }
  ]
}
```

## Development

### Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Development Notes

- Panorama images should have 2:1 ratio (equirectangular)
- Maximum image file size is 10MB when uploading
- Hotspots can only be linked when there are at least 2 rooms
- Use TypeScript for type safety

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Automatic deployment

### Manual Build

```bash
npm run build
```

Files will be built to `dist/` directory

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

If you have questions or suggestions, please create an issue on GitHub.

---

Made with React + Three.js
