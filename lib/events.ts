export const EVENTS = {
  StudentClaim: "student:claim",
  StudentRelease: "student:release",
  StudentStroke: "student:stroke",
  StudentClearOwn: "student:clear-own",
  TeacherJoin: "teacher:join",
  TeacherStartRound: "teacher:start-round",
  TeacherNextRound: "teacher:next-round",
  TeacherRate: "teacher:rate",
  TeacherEndSession: "teacher:end-session",
  TeacherResetSession: "teacher:reset-session",
  StateSnapshot: "state:snapshot",
  RoundStart: "round:start",
  StudentDrawingUpdate: "student:drawing-update",
  StudentStrokePartial: "student:stroke-partial",
  StudentStatusChange: "student:status-change",
  RatingUpdated: "rating:updated",
  SessionFinished: "session:finished"
} as const;
