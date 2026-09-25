import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
from faster_whisper import WhisperModel
import tempfile
import os
import sys

SAMPLE_RATE = 16000
DURATION = 6

# Make output appear immediately when Electron reads it
sys.stdout.reconfigure(line_buffering=True)

print("READY")
print("Speak now...")

# Start recording immediately
audio = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype="float32"
)

sd.wait()

audio = np.squeeze(audio)

with tempfile.NamedTemporaryFile(
    suffix=".wav",
    delete=False
) as temp_file:
    temp_path = temp_file.name

write(
    temp_path,
    SAMPLE_RATE,
    (audio * 32767).astype(np.int16)
)

print("Recording complete.")
print("Loading Whisper...")

# Load model AFTER recording
model = WhisperModel(
    "tiny.en",
    device="cpu",
    compute_type="int8"
)

print("Transcribing...")

segments, info = model.transcribe(
    temp_path,
    language="en",
    beam_size=5,
    vad_filter=True,
    vad_parameters=dict(
        min_silence_duration_ms=300
    )
)

text_parts = []

for segment in segments:
    text = segment.text.strip()

    if text:
        text_parts.append(text)

text = " ".join(text_parts).strip()

print()
print("Detected language:", info.language)
print("You said:", text)

try:
    os.remove(temp_path)
except Exception:
    pass