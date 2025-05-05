"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { RiVideoAddLine, RiExternalLinkFill } from "react-icons/ri";

import crypto from "crypto";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
	const router = useRouter();

	const [meetingId, setMeetingId] = useState<string>("");

	const handleCreateNewMeeting = () => {
		const newMeetingRoute = crypto.randomBytes(10).toString("hex");

		router.push(`/room/${newMeetingRoute}`);
	};

	const handleMeetingJoin = () => {
		if (!meetingId) return;

		router.push(`/room/${encodeURIComponent(meetingId)}`);

		setMeetingId("");
	};

	return (
		<div className="flex flex-col-reverse justify-center items-center md:flex-row p-5 md:justify-around md:items-center h-screen">
			{/* Meeting Buttons */}
			<div>
				<div>
					<h1 className="text-2xl md:text-4xl font-bold">
						Connect. Collaborate. Communicate.
					</h1>
					<h3 className="text-sm md:text-lg text-muted-foreground italic">
						Start a new meeting or join an ongoing one
					</h3>
				</div>
				<div className="mt-5 flex justify-between items-center">
					<Button onClick={handleCreateNewMeeting} className="">
						<RiVideoAddLine />
						<span className="hidden md:block">New Meeting</span>
					</Button>
					<div className="mx-3">
						<p>OR</p>
					</div>
					<Input
						placeholder="Join Another Meeting"
						className="mr-3"
						value={meetingId}
						onChange={(e) => setMeetingId(e.target.value)}
					/>
					<Button variant="outline" onClick={handleMeetingJoin}>
						<RiExternalLinkFill />
						<span className="hidden md:block">Join</span>
					</Button>
				</div>
			</div>
			{/* Video Illustrations */}
			<div>
				<Image
					src="https://static.vecteezy.com/system/resources/previews/032/401/306/non_2x/video-call-hispanic-adult-woman-black-and-white-2d-cartoon-character-webinar-screen-entrepreneur-female-latina-isolated-outline-person-videoconference-monochromatic-flat-spot-illustration-vector.jpg"
					alt="call-graphic"
					width={500}
					height={500}
					draggable={false}
					layout="responsive"
				/>
			</div>
		</div>
	);
}
