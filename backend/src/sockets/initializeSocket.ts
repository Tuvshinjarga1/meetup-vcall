import { type Server } from "socket.io";
import { roomEvents } from "./events/lobbyEvents";
import { callEvents } from "./events/callEvents";
import { peerEvents } from "./events/peerEvents";

export const initializeSocket = (io: Server) => {
	io.on("connection", (socket) => {
		console.log(`🆕 ${socket.id} joined!`);

		roomEvents(io, socket);
		callEvents(io, socket);
		peerEvents(io, socket);

		socket.on("disconnect", () =>
			console.log(`🛑 ${socket.id} disconnected`)
		);
	});
};
