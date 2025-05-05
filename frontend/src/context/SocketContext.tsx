"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { io, type Socket } from "socket.io-client";

type SocketContextValue = {
	socket: Socket;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = () => {
	const returnContext = useContext(SocketContext);

	if (!returnContext)
		throw new Error(
			"useSocket must be used within a SocketContext.Provider"
		);

	return returnContext;
};

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const socket = useMemo(
		() => io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL),
		[]
	);

	useEffect(() => {
		return () => {
			if (socket.connected) {
				socket.disconnect();
			}
		};
	}, [socket]);

	const value: SocketContextValue = {
		socket,
	};

	return (
		<SocketContext.Provider value={value}>
			{children}
		</SocketContext.Provider>
	);
};

export default SocketProvider;
