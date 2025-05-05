export interface CallData {
	id: string;
	roomId: string;
}

export interface CallOfferData extends CallData {
	offer: RTCSessionDescriptionInit;
}

export interface CallAnswerData extends CallData {
	answer: RTCSessionDescriptionInit;
}

export interface CallCandidateData extends CallData {
	candidate: RTCIceCandidate;
}
