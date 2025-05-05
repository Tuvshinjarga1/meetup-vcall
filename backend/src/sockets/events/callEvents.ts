import { type Server, type Socket } from "socket.io";
import { roomEventData } from "./lobbyEvents";

interface callOfferData extends roomEventData {
	offer: RTCSessionDescriptionInit;
}

interface callAnswerData extends roomEventData {
	answer: RTCSessionDescriptionInit;
}

export const callEvents = (io: Server, socket: Socket) => {
	socket.on("call:initiate", (data: callOfferData) => {
		socket.to(data.roomId).emit("call:incoming", data);
	});

	socket.on("call:accepted", (data: callAnswerData) => {
		socket.to(data.roomId).emit("call:accepted", data);
	});
};
