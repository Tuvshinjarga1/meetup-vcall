"use client";

class PeerService {
	_peer: RTCPeerConnection;

	constructor() {
		this._peer = new RTCPeerConnection({
			iceServers: [
				{
					urls: [
						"stun:stun.l.google.com:19302",
						"stun:stun1.l.google.com:19302",
						"stun:stun2.l.google.com:19302",
						"stun:stun3.l.google.com:19302",
						"stun:stun4.l.google.com:19302",
					],
				},
			],
		});
	}

	async getOffer(): Promise<RTCSessionDescriptionInit> {
		const offer = await this._peer.createOffer();

		await this._peer.setLocalDescription(new RTCSessionDescription(offer));

		return offer;
	}

	async setRemoteDescription(answer: RTCSessionDescriptionInit) {
		await this._peer.setRemoteDescription(
			new RTCSessionDescription(answer)
		);
	}

	async getAnswer(
		offer: RTCSessionDescriptionInit
	): Promise<RTCSessionDescriptionInit> {
		await this._peer.setRemoteDescription(offer);

		const answer = await this._peer.createAnswer();
		await this._peer.setLocalDescription(new RTCSessionDescription(answer));

		return answer;
	}
}

export default PeerService;
