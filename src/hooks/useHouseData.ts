import { useState } from "react";
import { mockHouseData } from "@/data/mockData";

// Hook quản lý dữ liệu house tour
export const useHouseData = () => {
  const [houseData, setHouseData] = useState<HouseData>(mockHouseData);

  // Reset về trạng thái rỗng
  const resetToDefault = () => {
    if (
      confirm(
        "Are you sure you want to reset to empty? This will delete all your changes."
      )
    ) {
      setHouseData(mockHouseData);
    }
  };

  return {
    houseData,
    setHouseData,
    resetToDefault,
  };
};
