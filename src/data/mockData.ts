// Dữ liệu khởi tạo ban đầu (rỗng)
// Admin sẽ tự thêm phòng sau
export const mockHouseData: HouseData = {
  houseName: "My 3D House Tour",
  description: "Click Admin Mode to add your first room",
  minimap: {
    url: "", // link ảnh sơ đồ mặt bằng
    width: 200,
    height: 150,
    floor: 1,
  },
  rooms: [], // khởi tạo rỗng
};
