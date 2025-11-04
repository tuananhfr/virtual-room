import { useState } from "react";
import { mockHouseData } from "@/data/mockData";

/**
 * Custom hook để quản lý house data với localStorage
 */
export const useHouseData = () => {
  // Always start with empty data - NO localStorage
  const [houseData, setHouseData] = useState<HouseData>(mockHouseData);

  // Export to JSON file
  const exportToJSON = () => {
    const dataStr = JSON.stringify(houseData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `house-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from JSON file
  const importFromJSON = (file: File): Promise<HouseData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === "string") {
            const data = JSON.parse(result) as HouseData;
            setHouseData(data);
            resolve(data);
          } else {
            reject(new Error("Invalid file content"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Reset to empty
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
    exportToJSON,
    importFromJSON,
    resetToDefault,
  };
};
