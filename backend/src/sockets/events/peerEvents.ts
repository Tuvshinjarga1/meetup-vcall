import { type Server, type Socket } from "socket.io";

export type roomEventData = {
	id: string;
	roomId: string;
};

export const peerEvents = (io: Server, socket: Socket) => {
	socket.on("peer:ice-candidate", (data) => {
		socket.to(data.roomId).emit("peer:ice-candidate", data);
	});
};
