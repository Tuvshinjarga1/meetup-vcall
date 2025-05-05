import { Toaster } from "@/components/ui/toaster";

const MeetingLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div>
			{children}
			<Toaster />
		</div>
	);
};

export default MeetingLayout;
