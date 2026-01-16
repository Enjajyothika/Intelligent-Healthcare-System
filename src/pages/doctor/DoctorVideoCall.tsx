import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const DoctorVideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const jitsiApiRef = useRef<any>(null);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    const domain = "meet.jit.si";

    const options = {
      roomName: `intellihealth-${roomId}`,
      parentNode: document.getElementById("jitsi-container"),

      userInfo: {
        displayName: "Doctor",
      },

      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },

      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "hangup",
          "fullscreen",
        ],
      },
    };

    jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);

    // ✅ Correct event when user clicks hangup
    jitsiApiRef.current.addEventListener("readyToClose", () => {
      setCallEnded(true);
      jitsiApiRef.current.dispose();
    });

    return () => {
      jitsiApiRef.current?.dispose();
    };
  }, [roomId]);

  if (callEnded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Call Ended</h2>
        <button
          onClick={() => navigate("/doctor/messages")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <div id="jitsi-container" className="w-full h-full" />
    </div>
  );
};

export default DoctorVideoCall;
