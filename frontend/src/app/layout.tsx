import "./globals.css";
import SocketProvider from "@/context/SocketContext";

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className="">
				<SocketProvider>{children}</SocketProvider>
			</body>
		</html>
	);
}
