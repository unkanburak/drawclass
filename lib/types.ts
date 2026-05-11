export type Rating = "great" | "good" | "ok" | "bad" | "terrible";

export type Point = { x: number; y: number };

export type Stroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
};

export type Student = {
  id: string;
  name: string;
  avatar: string;
};

export type ConnectedStudent = Student & {
  connected: boolean;
};

export type RoundDrawing = {
  strokes: Stroke[];
  rating?: Rating;
};

export type ClassroomStatus = "lobby" | "round-active" | "finished";

export type ClassroomSnapshot = {
  status: ClassroomStatus;
  currentRoundIndex: number;
  roundSequence: readonly number[];
  totalRounds: number;
  students: ConnectedStudent[];
  drawings: Record<string, Record<number, RoundDrawing>>;
};
