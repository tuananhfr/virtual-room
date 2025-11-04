/**
 * Data configuration for 3D House Tour
 * Start from empty - admin adds rooms manually
 */

// Default empty data
export const mockHouseData: HouseData = {
  houseName: "My 3D House Tour",
  description: "Click Admin Mode to add your first room",
  minimap: {
    url: "", // URL to floor plan/layout image
    width: 200, // Display width in pixels
    height: 150, // Display height in pixels
    floor: 1, // Default floor number
  },
  rooms: [], // Empty - admin must add rooms
};
