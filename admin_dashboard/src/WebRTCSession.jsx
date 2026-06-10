import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const WEBRTC_GATEWAY_URL = "http://127.0.0.1:8010";
const DEFAULT_CAMERA_ROBOTS = ["robot1", "robot5"];
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];
const MAP_LAYER_PRIORITY = {
  map: 0,
  global_costmap: 1,
  local_costmap: 2,
  camera_coverage: 3,
};

const WebRTCSessionContext = createContext(null);

function normalizeRobotId(id) {
  return String(id ?? "").trim().toLowerCase().replace(/-/g, "_");
}

function getMapRobotFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "";
  const hashParams = new URLSearchParams(hashQuery);
  return searchParams.get("mapRobot") || searchParams.get("robot") || hashParams.get("mapRobot") || hashParams.get("robot") || "robot5";
}

function waitForIceGathering(pc, timeoutMs = 1800) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(tid);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    const tid = setTimeout(done, timeoutMs);
  });
}

function shouldUseAsBaseMap(nextLayer, currentMap) {
  if (!currentMap) return true;
  const currentLayer = currentMap.layer ?? "map";
  return (MAP_LAYER_PRIORITY[nextLayer] ?? 99) < (MAP_LAYER_PRIORITY[currentLayer] ?? 99);
}

function normalizeMapPayload(data, image = data.image) {
  const width = Number(data.width ?? data.info?.width);
  const height = Number(data.height ?? data.info?.height);
  const resolution = Number(data.resolution ?? data.info?.resolution);
  if (!image || !width || !height || !resolution) return null;
  return {
    ...data,
    image,
    layer: data.layer ?? "map",
    width,
    height,
    resolution,
    origin: data.origin ?? data.info?.origin ?? { x: 0, y: 0, yaw: 0 },
  };
}

function decodeRleInt8(encoded, expectedLength) {
  const values = [];
  for (let i = 0; i < encoded.length; i += 2) {
    const value = encoded[i];
    const count = encoded[i + 1];
    for (let j = 0; j < count; j += 1) values.push(value);
  }
  if (expectedLength && values.length > expectedLength) return values.slice(0, expectedLength);
  return values;
}

function gridToDataUrl(gridPayload) {
  const info = gridPayload.info ?? gridPayload;
  const width = Number(info.width);
  const height = Number(info.height);
  if (!width || !height || !Array.isArray(gridPayload.data)) return null;

  const layer = gridPayload.layer ?? "map";
  const values = decodeRleInt8(gridPayload.data, width * height);
  if (values.length < width * height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcIdx = (height - 1 - y) * width + x;
      const dstIdx = (y * width + x) * 4;
      const value = values[srcIdx];
      const unknown = value < 0;
      const occupied = value >= 65;
      const covered = value >= 1;
      let rgba = [0, 0, 0, 0];

      if (layer === "map") {
        rgba = unknown ? [92, 105, 106, 190] : occupied ? [38, 47, 61, 255] : [245, 245, 245, 245];
      } else if (layer === "global_costmap") {
        rgba = occupied ? [37, 99, 235, 130] : [37, 99, 235, 18];
      } else if (layer === "local_costmap") {
        rgba = occupied ? [239, 68, 68, 155] : [239, 68, 68, 18];
      } else if (layer === "camera_coverage") {
        rgba = covered ? [34, 197, 94, 95] : [0, 0, 0, 0];
      }

      image.data[dstIdx] = rgba[0];
      image.data[dstIdx + 1] = rgba[1];
      image.data[dstIdx + 2] = rgba[2];
      image.data[dstIdx + 3] = rgba[3];
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function WebRTCSessionProvider({ active, children }) {
  const mapRobot = useMemo(() => getMapRobotFromLocation(), []);
  const cameraPcsRef = useRef({});
  const cameraRetryRef = useRef({});
  const mapPcRef = useRef(null);
  const mapRetryRef = useRef(null);

  const [cameraStreams, setCameraStreams] = useState({});
  const [cameraStates, setCameraStates] = useState({});
  const [streamMap, setStreamMap] = useState(null);
  const [streamLayers, setStreamLayers] = useState({});
  const [streamMarkers, setStreamMarkers] = useState({});
  const [streamPose, setStreamPose] = useState(null);
  const [mapStreamState, setMapStreamState] = useState("idle");

  useEffect(() => {
    if (!active) return undefined;
    let alive = true;

    const connectCamera = async (robotId) => {
      const key = normalizeRobotId(robotId);
      if (!alive || cameraPcsRef.current[key]) return;
      setCameraStates((prev) => ({ ...prev, [key]: "connecting" }));

      try {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        cameraPcsRef.current[key] = pc;

        pc.ontrack = (event) => {
          const stream = event.streams[0];
          if (!stream) return;
          setCameraStreams((prev) => ({ ...prev, [key]: stream }));
          setCameraStates((prev) => ({ ...prev, [key]: "connected" }));
        };

        pc.onconnectionstatechange = () => {
          if (!alive) return;
          if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
            pc.close();
            delete cameraPcsRef.current[key];
            setCameraStates((prev) => ({ ...prev, [key]: "error" }));
            cameraRetryRef.current[key] = setTimeout(() => connectCamera(robotId), 5000);
          }
        };

        pc.addTransceiver("video", { direction: "recvonly" });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc);

        const res = await fetch(`${WEBRTC_GATEWAY_URL}/offer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "video", robotId, sdp: offer.sdp, type: offer.type }),
        });
        if (!res.ok) throw new Error(`camera signaling failed: ${res.status}`);

        const answer = await res.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch {
        if (cameraPcsRef.current[key]) {
          cameraPcsRef.current[key].close();
          delete cameraPcsRef.current[key];
        }
        if (alive) {
          setCameraStates((prev) => ({ ...prev, [key]: "error" }));
          cameraRetryRef.current[key] = setTimeout(() => connectCamera(robotId), 5000);
        }
      }
    };

    DEFAULT_CAMERA_ROBOTS.forEach((robotId) => connectCamera(robotId));

    return () => {
      alive = false;
      Object.values(cameraRetryRef.current).forEach(clearTimeout);
      Object.values(cameraPcsRef.current).forEach((pc) => pc.close());
      cameraRetryRef.current = {};
      cameraPcsRef.current = {};
      setCameraStates({});
      setCameraStreams({});
    };
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    let alive = true;

    const connectMap = async () => {
      if (!alive || mapPcRef.current) return;
      setMapStreamState("connecting");

      try {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        mapPcRef.current = pc;
        const channel = pc.createDataChannel("ares-map");

        channel.onopen = () => {
          if (!alive) return;
          setMapStreamState("connected");
          channel.send("ping");
        };

        channel.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "map") {
              const layer = data.layer ?? "map";
              const mapPayload = normalizeMapPayload(data);
              if (!mapPayload) return;
              setStreamLayers((prev) => ({ ...prev, [layer]: mapPayload }));
              setStreamMap((prev) => (shouldUseAsBaseMap(layer, prev) ? mapPayload : prev));
              setMapStreamState("receiving");
            } else if (data.type === "grid") {
              const layer = data.layer ?? "map";
              const image = gridToDataUrl(data);
              const gridMap = image ? normalizeMapPayload({ ...data, layer }, image) : null;
              if (!gridMap) return;
              setStreamLayers((prev) => ({ ...prev, [layer]: gridMap }));
              setStreamMap((prev) => (shouldUseAsBaseMap(layer, prev) ? gridMap : prev));
              setMapStreamState("receiving");
            } else if (data.type === "pose" || data.type === "robot_pose") {
              setStreamPose(data);
            } else if (data.type === "markers") {
              const layer = data.layer ?? "markers";
              setStreamMarkers((prev) => ({ ...prev, [layer]: data.markers ?? [] }));
            }
          } catch {
            // Ignore malformed map stream messages.
          }
        };

        pc.onconnectionstatechange = () => {
          if (!alive) return;
          if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
            pc.close();
            mapPcRef.current = null;
            setMapStreamState("error");
            mapRetryRef.current = setTimeout(connectMap, 5000);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc);

        const res = await fetch(`${WEBRTC_GATEWAY_URL}/offer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "map", robotId: mapRobot, sdp: offer.sdp, type: offer.type }),
        });
        if (!res.ok) throw new Error(`map signaling failed: ${res.status}`);

        const answer = await res.json();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch {
        if (mapPcRef.current) {
          mapPcRef.current.close();
          mapPcRef.current = null;
        }
        if (alive) {
          setMapStreamState("error");
          mapRetryRef.current = setTimeout(connectMap, 5000);
        }
      }
    };

    connectMap();

    return () => {
      alive = false;
      if (mapRetryRef.current) clearTimeout(mapRetryRef.current);
      if (mapPcRef.current) {
        mapPcRef.current.close();
        mapPcRef.current = null;
      }
      setMapStreamState("idle");
    };
  }, [active, mapRobot]);

  const value = useMemo(
    () => ({
      cameraStreams,
      cameraStates,
      mapRobot,
      streamMap,
      streamLayers,
      streamMarkers,
      streamPose,
      mapStreamState,
    }),
    [cameraStreams, cameraStates, mapRobot, streamMap, streamLayers, streamMarkers, streamPose, mapStreamState],
  );

  return <WebRTCSessionContext.Provider value={value}>{children}</WebRTCSessionContext.Provider>;
}

export function useWebRTCSession() {
  const context = useContext(WebRTCSessionContext);
  if (!context) {
    return {
      cameraStreams: {},
      cameraStates: {},
      mapRobot: "robot5",
      streamMap: null,
      streamLayers: {},
      streamMarkers: {},
      streamPose: null,
      mapStreamState: "idle",
    };
  }
  return context;
}
