// socket.js
let ioInstance = null;

function init(io) {
  ioInstance = io;
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // register client to a room named by userId
    socket.on("registerUser", (userId) => {
      if (!userId) return;
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

module.exports = { init, getIO };
