"use client";

import { useState, useRef } from "react";

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onEvaluationComplete: (evaluation: {
    feedback: string;
    scores: {
      fluency: number;
      lexical: number;
      grammar: number;
      pronunciation: number;
      overall: number;
    };
  }) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  onEvaluationComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser doesn't support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];

        try {
          // Create FormData with audio blob
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.wav");

          // First, get transcription
          const transcribeResponse = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!transcribeResponse.ok) {
            throw new Error("Transcription failed");
          }

          const { text } = await transcribeResponse.json();
          onTranscriptionComplete(text);

          // Then, get evaluation
          const evaluateResponse = await fetch("/api/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });

          if (!evaluateResponse.ok) {
            throw new Error("Evaluation failed");
          }

          const { evaluation, scores } = await evaluateResponse.json();
          onEvaluationComplete({ feedback: evaluation, scores });
        } catch (error) {
          console.error("Error processing audio:", error);
          alert("Failed to process audio. Please try again.");
        } finally {
          setIsProcessing(false);
          // Stop all tracks of the stream
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onMouseDown={handleStartRecording}
        onMouseUp={handleStopRecording}
        onMouseLeave={handleStopRecording}
        disabled={isProcessing}
        className={`px-4 py-2 rounded-lg ${
          isRecording
            ? "bg-red-500 text-white"
            : isProcessing
            ? "bg-gray-400 text-white"
            : "bg-green-500 text-white hover:bg-green-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isRecording
          ? "Recording..."
          : isProcessing
          ? "Processing..."
          : "Push to Talk"}
      </button>
      {isProcessing && (
        <p className="text-sm text-gray-600">
          Processing your response, please wait...
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder;
