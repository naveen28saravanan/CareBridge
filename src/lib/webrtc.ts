/**
 * WebRTC Telehealth Peer Connection ICE Configuration Helper
 * Provides automatic fallback between Google STUN servers and production TURN servers
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function getIceServers(): IceServerConfig[] {
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  const defaultStunServers: IceServerConfig[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  if (turnUrl) {
    const turnConfig: IceServerConfig = {
      urls: turnUrl,
      ...(turnUsername && { username: turnUsername }),
      ...(turnCredential && { credential: turnCredential }),
    };
    return [...defaultStunServers, turnConfig];
  }

  return defaultStunServers;
}

export function createRtcPeerConnection(customConfig?: RTCConfiguration): RTCPeerConnection {
  const config: RTCConfiguration = {
    iceServers: getIceServers(),
    iceTransportPolicy: "all",
    ...customConfig,
  };
  return new RTCPeerConnection(config);
}
