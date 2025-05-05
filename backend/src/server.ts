import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";
import { initializeSocket } from "./sockets/initializeSocket";

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

// ---- Middlewares ----

// ---- ----------- ----

initializeSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log("✅ Server up and running.\n"));
