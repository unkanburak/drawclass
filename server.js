/* Custom Next.js + Socket.IO server — tek port, in-memory classroom state */
const next = require("next");
const { createServer } = require("http");
const { parse } = require("url");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

const ROUND_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const TOTAL_ROUNDS = ROUND_SEQUENCE.length;

const E = {
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
};

const classroom = {
  status: "lobby", // 'lobby' | 'round-active' | 'finished'
  currentRoundIndex: -1, // -1 = henüz başlamadı
  roundSequence: ROUND_SEQUENCE,
  totalRounds: TOTAL_ROUNDS,
  studentsById: {}, // dinamik — öğrenciler bağlandıkça oluşur
  drawings: {}     // { [studentId]: { [roundIdx]: { strokes: [], rating? } } }
};

function snapshot() {
  return {
    status: classroom.status,
    currentRoundIndex: classroom.currentRoundIndex,
    roundSequence: classroom.roundSequence,
    totalRounds: classroom.totalRounds,
    students: Object.values(classroom.studentsById).map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      connected: s.connected
    })),
    drawings: classroom.drawings
  };
}

function ensureDrawingSlot(studentId, roundIdx) {
  if (!classroom.drawings[studentId]) classroom.drawings[studentId] = {};
  if (!classroom.drawings[studentId][roundIdx]) {
    classroom.drawings[studentId][roundIdx] = { strokes: [] };
  }
  return classroom.drawings[studentId][roundIdx];
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // socket.data.role: 'teacher' | 'student'
  // socket.data.studentId (only for students)

  io.on("connection", (socket) => {
    socket.emit(E.StateSnapshot, snapshot());

    socket.on(E.TeacherJoin, () => {
      socket.data.role = "teacher";
      socket.join("teachers");
      socket.emit(E.StateSnapshot, snapshot());
    });

    socket.on(E.StudentClaim, ({ name, avatar }) => {
      if (!name || !avatar) return;
      const studentId = socket.id;
      socket.data.role = "student";
      socket.data.studentId = studentId;
      classroom.studentsById[studentId] = {
        id: studentId,
        name: String(name).trim().slice(0, 40),
        avatar,
        connected: true,
        socketId: socket.id
      };
      socket.join("students");
      // Tüm bağlı istemcilere (öğretmen dahil) güncel listeyi gönder
      io.emit(E.StateSnapshot, snapshot());
    });

    socket.on(E.StudentClearOwn, () => {
      const sid = socket.data.studentId;
      if (!sid) return;
      const roundIdx = classroom.currentRoundIndex;
      if (roundIdx < 0) return;
      const slot = ensureDrawingSlot(sid, roundIdx);
      slot.strokes = [];
      io.emit(E.StudentDrawingUpdate, {
        studentId: sid,
        roundIdx,
        replace: true,
        strokes: []
      });
    });

    socket.on(E.StudentStroke, ({ stroke }) => {
      const sid = socket.data.studentId;
      if (!sid) return;
      const roundIdx = classroom.currentRoundIndex;
      if (roundIdx < 0 || classroom.status !== "round-active") return;
      const slot = ensureDrawingSlot(sid, roundIdx);
      slot.strokes.push(stroke);
      io.emit(E.StudentDrawingUpdate, {
        studentId: sid,
        roundIdx,
        stroke
      });
    });

    socket.on(E.StudentStrokePartial, ({ points, color, size }) => {
      const sid = socket.data.studentId;
      if (!sid) return;
      const roundIdx = classroom.currentRoundIndex;
      if (roundIdx < 0 || classroom.status !== "round-active") return;
      io.emit(E.StudentStrokePartial, {
        studentId: sid,
        roundIdx,
        points,
        color,
        size
      });
    });

    socket.on(E.TeacherStartRound, () => {
      if (socket.data.role !== "teacher") return;
      classroom.currentRoundIndex = 0;
      classroom.status = "round-active";
      classroom.drawings = {};
      io.emit(E.RoundStart, {
        roundIdx: 0,
        target: ROUND_SEQUENCE[0],
        totalRounds: TOTAL_ROUNDS
      });
      io.emit(E.StateSnapshot, snapshot());
    });

    socket.on(E.TeacherNextRound, () => {
      if (socket.data.role !== "teacher") return;
      if (classroom.currentRoundIndex < 0) return;
      const next = classroom.currentRoundIndex + 1;
      if (next >= TOTAL_ROUNDS) {
        classroom.status = "finished";
        io.emit(E.SessionFinished, { snapshot: snapshot() });
        io.emit(E.StateSnapshot, snapshot());
        return;
      }
      classroom.currentRoundIndex = next;
      classroom.status = "round-active";
      io.emit(E.RoundStart, {
        roundIdx: next,
        target: ROUND_SEQUENCE[next],
        totalRounds: TOTAL_ROUNDS
      });
      io.emit(E.StateSnapshot, snapshot());
    });

    socket.on(E.TeacherRate, ({ studentId, roundIdx, rating }) => {
      if (socket.data.role !== "teacher") return;
      const slot = ensureDrawingSlot(studentId, roundIdx);
      slot.rating = rating;
      io.emit(E.RatingUpdated, { studentId, roundIdx, rating });
    });

    socket.on(E.TeacherEndSession, () => {
      if (socket.data.role !== "teacher") return;
      classroom.status = "finished";
      io.emit(E.SessionFinished, { snapshot: snapshot() });
      io.emit(E.StateSnapshot, snapshot());
    });

    socket.on(E.TeacherResetSession, () => {
      if (socket.data.role !== "teacher") return;
      classroom.status = "lobby";
      classroom.currentRoundIndex = -1;
      classroom.drawings = {};
      classroom.studentsById = {}; // herkes tekrar login yapacak
      io.emit(E.StateSnapshot, snapshot());
    });

    socket.on("disconnect", () => {
      if (socket.data.role === "student" && socket.data.studentId) {
        const sid = socket.data.studentId;
        const s = classroom.studentsById[sid];
        if (s && s.socketId === socket.id) {
          s.connected = false;
          s.socketId = null;
          // Öğretmen paneline bağlantı koptuğu anında yansısın
          io.emit(E.StateSnapshot, snapshot());
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
