/**
 * Data configuration for 3D House Tour
 * Start from empty - admin adds rooms manually
 */

// Default empty data with one floor
export const mockHouseData: HouseData = {
  houseName: "My 3D House Tour",
  description: "Click Admin Mode to add your first floor",
  floors: [
    {
      floor_id: "floor_1",
      floor_number: 1,
      floor_label: "Ground Floor",
      minimap: {
        url: "", // URL to floor plan/layout image
        width: 200, // Display width in pixels
        height: 150, // Display height in pixels
      },
      rooms: [], // Empty - admin must add rooms
    },
  ],
};
