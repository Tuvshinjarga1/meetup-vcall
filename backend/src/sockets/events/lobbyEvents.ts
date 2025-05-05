import { type Server, type Socket } from "socket.io";

export type roomEventData = {
	id: string;
	roomId: string;
};

export const roomEvents = (io: Server, socket: Socket) => {
	socket.on("lobby:join-request", (data: roomEventData) => {
		let clientsInRoom = io.sockets.adapter.rooms.get(data.roomId);

		// If there are no existing clients in the lobby, then join directly.
		if (!clientsInRoom || (clientsInRoom && clientsInRoom.size == 0)) {
			socket.join(data.roomId);

			return;
		}

		// else, send a join-request event to other person in the same lobby.
		socket.to(data.roomId).emit("lobby:join-request", {
			id: socket.id,
			roomId: data.roomId,
		});
	});

	socket.on("lobby:join-accepted", (data: roomEventData) => {
		io.sockets.sockets.get(data.id)?.join(data.roomId);
	});

	socket.on("lobby:leave", (data: roomEventData) => {
		socket.leave(data.roomId);

		socket.to(data.roomId).emit("call:remote-left");
	});
};
