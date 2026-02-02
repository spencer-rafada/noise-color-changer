interface SpeechFeedbackProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
}

export function SpeechFeedback({
  isListening,
  transcript,
  interimTranscript,
}: SpeechFeedbackProps) {
  return (
    <div className="speech-feedback">
      {isListening && (
        <div className="listening-indicator">
          <span className="mic-pulse" />
          Listening...
        </div>
      )}
      {transcript && (
        <div className="speech-transcript final">&ldquo;{transcript}&rdquo;</div>
      )}
      {!transcript && interimTranscript && (
        <div className="speech-transcript interim">
          &ldquo;{interimTranscript}&rdquo;
        </div>
      )}
      {!isListening && !transcript && !interimTranscript && (
        <div className="speech-prompt">Tap the button to speak your answer</div>
      )}
    </div>
  );
}
