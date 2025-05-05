"use client";

import VideoPlayer from "@/components/app/VideoPlayer";
import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { ToastAction } from "@/components/ui/toast";
import PeerService from "@/service/PeerService";
import { Button } from "@/components/ui/button";
import {
	CallData,
	CallOfferData,
	CallAnswerData,
	CallCandidateData,
} from "./types";

import { IoCall } from "react-icons/io5";
import { RiVideoOffFill } from "react-icons/ri";
import { BiSolidMicrophone } from "react-icons/bi";
import { LuLoaderPinwheel } from "react-icons/lu";

const Meeting = () => {
	const { meetingId } = useParams();
	const { socket } = useSocket();
	const { toast } = useToast();
	const router = useRouter();

	const peerRef = useRef<PeerService | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
	const isRemoteDescriptionSet = useRef<boolean>(false);

	const [videoControls, setVideoControls] = useState<{
		isAudioActive: boolean;
		isVideoActive: boolean;
	}>({ isAudioActive: false, isVideoActive: true });

	const [streams, setStreams] = useState<{
		local: MediaStream | null;
		remote: MediaStream | null;
	}>({ local: null, remote: null });

	// Handle cleanup of media streams
	const cleanupStreams = useCallback(() => {
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
		}

		if (peerRef.current) {
			peerRef.current._peer.close();
		}
	}, []);

	// Initialize media stream
	const initializeMediaStream = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});

			localStreamRef.current = stream;
			setStreams((prev) => ({ ...prev, local: stream }));

			return stream;
		} catch (error) {
			console.error("Failed to get media stream:", error);

			toast({
				title: "Error",
				description: "Failed to access camera/microphone",
				variant: "destructive",
			});

			return null;
		}
	}, []);

	// Add tracks to peer connection
	const addTracksToConnection = useCallback((stream: MediaStream) => {
		stream.getTracks().forEach((track) => {
			if (peerRef.current?._peer) {
				peerRef.current._peer.addTrack(track, stream);
			}
		});
	}, []);

	const handleCallerJoinRequest = (data: CallData) => {
		toast({
			title: "Someone wants to join this call",
			action: (
				<ToastAction
					altText="Accept"
					onClick={() => handleCallerAccepted(data.id)}
				>
					Accept
				</ToastAction>
			),
		});
	};

	const handleCallerAccepted = useCallback(
		async (socketId: string) => {
			socket.emit("lobby:join-accepted", {
				id: socketId,
				roomId: meetingId,
			});

			const stream = await initializeMediaStream();
			if (!stream) return;

			addTracksToConnection(stream);

			try {
				const offer = await peerRef.current!.getOffer();

				socket.emit("call:initiate", {
					id: socket.id,
					roomId: meetingId,
					offer,
				});
			} catch (error) {
				console.error("Failed to create offer:", error);

				toast({
					title: "Error",
					description: "Failed to establish connection",
					variant: "destructive",
				});
			}
		},
		[socket, meetingId]
	);

	// Function to process queued ICE candidates
	const processIceCandidateQueue = useCallback(async () => {
		while (
			iceCandidatesQueue.current.length > 0 &&
			isRemoteDescriptionSet.current
		) {
			const candidate = iceCandidatesQueue.current.shift();

			try {
				await peerRef.current?._peer.addIceCandidate(candidate!);
			} catch (error) {
				console.error("Error adding queued ICE candidate:", error);
			}
		}
	}, []);

	const handleIncomingCall = useCallback(
		async (data: CallOfferData) => {
			try {
				const stream = await initializeMediaStream();
				if (!stream) return;

				addTracksToConnection(stream);

				// Set remote description first
				await peerRef.current?._peer.setRemoteDescription(data.offer);
				isRemoteDescriptionSet.current = true;

				// Create and send answer
				const answer = await peerRef.current!.getAnswer(data.offer);
				socket.emit("call:accepted", {
					id: socket.id,
					roomId: meetingId,
					answer,
				});

				// Process any queued candidates
				await processIceCandidateQueue();
			} catch (error) {
				console.error("Error handling incoming call:", error);
				toast({
					title: "Error",
					description: "Failed to handle incoming call",
					variant: "destructive",
				});
			}
		},
		[socket, meetingId]
	);

	const handleAcceptedCall = useCallback(async (data: CallAnswerData) => {
		try {
			await peerRef.current?.setRemoteDescription(data.answer);
			isRemoteDescriptionSet.current = true;
			// Process any queued candidates
			await processIceCandidateQueue();
		} catch (error) {
			console.error("Error setting remote description:", error);
		}
	}, []);

	const handleIceCandidate = useCallback(async (data: CallCandidateData) => {
		try {
			if (isRemoteDescriptionSet.current) {
				// If remote description is set, add candidate immediately
				await peerRef.current?._peer.addIceCandidate(data.candidate);
			} else {
				// Queue the candidate for later
				iceCandidatesQueue.current.push(data.candidate);
			}
		} catch (error) {
			console.error("Error handling ICE candidate:", error);
		}
	}, []);

	const handleDisconnect = () => {
		router.replace("/");

		setStreams({ local: null, remote: null });

		// disconnect socket from room
		socket.emit("lobby:leave", { id: socket.id, roomId: meetingId });

		// Close Peer connection
		peerRef.current!._peer.close();
	};

	const handleRemoteLeft = useCallback(() => {
		setStreams((prev) => ({ ...prev, remote: null }));

		toast({
			title: "User left this meeting",
		});
	}, []);

	const handleAVToggle = (kind: string) => {
		if (!localStreamRef.current) return;

		if (localStreamRef.current.getTracks().length > 0) {
			localStreamRef.current
				.getTracks()
				.forEach(
					(track) =>
						(track.enabled =
							track.kind === kind
								? !track.enabled
								: track.enabled)
				);

			return;
		}
	};

	useEffect(() => {
		peerRef.current = new PeerService();
		isRemoteDescriptionSet.current = false;
		iceCandidatesQueue.current = [];

		// Set up event listeners
		peerRef.current._peer.addEventListener("track", (e) => {
			setStreams((prev) => ({ ...prev, remote: e.streams[0] }));
		});

		peerRef.current._peer.onicecandidate = (event) => {
			if (event.candidate) {
				socket.emit("peer:ice-candidate", {
					id: socket.id,
					roomId: meetingId,
					candidate: event.candidate,
				});
			}
		};

		socket.emit("lobby:join-request", {
			id: socket.id,
			roomId: meetingId,
		});

		// Socket event listeners
		socket.on("lobby:join-request", handleCallerJoinRequest);
		socket.on("call:incoming", handleIncomingCall);
		socket.on("call:accepted", handleAcceptedCall);
		socket.on("call:remote-left", handleRemoteLeft);
		socket.on("peer:ice-candidate", handleIceCandidate);

		return () => {
			cleanupStreams();

			socket.off("lobby:join-request", handleCallerJoinRequest);
			socket.off("call:incoming", handleIncomingCall);
			socket.off("call:accepted", handleAcceptedCall);
			socket.off("call:remote-left", handleRemoteLeft);
			socket.off("peer:ice-candidate", handleIceCandidate);

			peerRef.current?._peer.close();

			isRemoteDescriptionSet.current = false;
			iceCandidatesQueue.current = [];
		};
	}, []);

	return !streams.local && !streams.remote ? (
		<div className="h-screen p-4 flex flex-col justify-around items-center">
			<div className="flex items-center">
				<LuLoaderPinwheel className="animate-spin" size={20} />
				<h1 className="ml-3">Waiting for others to join</h1>
			</div>
		</div>
	) : (
		<div className="h-screen p-4 flex flex-col justify-around items-center">
			<div className="flex flex-col md:flex-row items-center justify-center gap-4 ">
				{streams.local && (
					<div className="relative">
						<h2 className="absolute top-2 left-2 z-10 bg-black/50 text-white px-2 py-1 rounded">
							You
						</h2>
						<VideoPlayer stream={streams.local} isRemote={false} />
					</div>
				)}
				{streams.remote && (
					<div className="relative">
						<h2 className="absolute top-2 left-2 z-10 bg-black/50 text-white px-2 py-1 rounded">
							Remote User
						</h2>
						<VideoPlayer stream={streams.remote} isRemote={true} />
					</div>
				)}
			</div>

			<div className="rounded-lg mt-5 p-5 bg-secondary flex justify-center items-center w-5/6">
				<div className="w-full md:w-1/3 flex items-center justify-around">
					<Button
						onClick={handleDisconnect}
						className="rounded-full bg-destructive border cursor-pointer hover:bg-destructive p-5"
					>
						<IoCall className="text-white" size={200} />
					</Button>
					<Button
						onClick={() => handleAVToggle("video")}
						className="rounded-full bg-white border cursor-pointer hover:bg-muted p-5"
					>
						<RiVideoOffFill className="text-black" size={200} />
					</Button>
					<Button
						onClick={() => handleAVToggle("audio")}
						className="rounded-full bg-white border cursor-pointer hover:bg-muted p-5"
					>
						<BiSolidMicrophone className="text-black" size={200} />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Meeting;
