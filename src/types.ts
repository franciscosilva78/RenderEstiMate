export interface User {
  id: string;
  name: string;
  role: "QA" | "Dev" | "ScrumMaster";
  vote: number | null;
}

export interface RoomState {
  id: string;
  name: string;
  status: "voting" | "revealed";
  calculationMethod: "average" | "sumByRole";
  manualModeSelections: Record<string, number>; // e.g., { "QA": 1.0, "Dev": 2.0 }
  users: Record<string, User>;
}
