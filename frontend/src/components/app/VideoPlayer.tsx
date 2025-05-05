import { useEffect, useRef } from "react";

const VideoPlayer = ({
	stream,
	isRemote,
}: {
	stream: MediaStream;
	isRemote: boolean;
}) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		let video = videoRef.current!;

		video.srcObject = stream;

		const handleLoadedMetadata = () => {
			video.play();
		};

		video.addEventListener("loadedmetadata", handleLoadedMetadata);

		return () => {
			video.removeEventListener("loadedmetadata", handleLoadedMetadata);
		};
	}, [stream]);

	return (
		<div>
			<video
				ref={videoRef}
				className="rounded-lg object-cover"
				autoPlay
				muted={!isRemote}
				playsInline
			></video>
		</div>
	);
};

export default VideoPlayer;
