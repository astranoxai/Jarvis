from flask import Flask, request, jsonify
from flask_cors import CORS

from faster_whisper import WhisperModel

import base64
import os
import tempfile


# ============================================================
# NOVA LOCAL VOICE SERVER
# ============================================================

app = Flask(__name__)
CORS(app)


MODEL_NAME = os.environ.get(
    "NOVA_WHISPER_MODEL",
    "tiny.en"
)


print("=" * 55)
print("NOVA LOCAL VOICE")
print(f"Loading Whisper model: {MODEL_NAME}")
print("=" * 55)


model = WhisperModel(
    MODEL_NAME,
    device="cpu",
    compute_type="int8"
)


print("Whisper model ready.")
print("=" * 55)


# ============================================================
# HELPERS
# ============================================================

def decode_audio(audio_value):
    if not isinstance(audio_value, str):
        raise ValueError(
            "Audio must be a base64 string."
        )

    audio_value = audio_value.strip()

    if not audio_value:
        raise ValueError(
            "Audio is empty."
        )

    if "," in audio_value:
        header, encoded = audio_value.split(
            ",",
            1
        )

        if "base64" not in header.lower():
            raise ValueError(
                "Audio data URL is not base64 encoded."
            )

        return base64.b64decode(
            encoded
        )

    return base64.b64decode(
        audio_value
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "NOVA Local Voice",
        "model": MODEL_NAME
    })


# ============================================================
# TRANSCRIBE
# ============================================================

@app.post("/transcribe")
def transcribe():
    temp_path = None

    try:
        body = request.get_json(
            force=True,
            silent=False
        )

        if not isinstance(body, dict):
            raise ValueError(
                "Invalid request body."
            )

        audio_value = body.get(
            "audio"
        )

        audio_bytes = decode_audio(
            audio_value
        )

        if len(audio_bytes) < 1000:
            return jsonify({
                "success": True,
                "text": "",
                "language": None,
                "language_probability": 0
            })

        suffix = body.get(
            "suffix",
            ".webm"
        )

        if suffix not in [
            ".webm",
            ".ogg",
            ".wav",
            ".mp3",
            ".m4a"
        ]:
            suffix = ".webm"

        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            delete=False
        ) as temp_file:

            temp_file.write(
                audio_bytes
            )

            temp_path = (
                temp_file.name
            )

        segments, info = model.transcribe(
            temp_path,

            beam_size=1,

            best_of=1,

            vad_filter=True,

            vad_parameters={
                "min_silence_duration_ms": 300,
                "speech_pad_ms": 150
            },

            condition_on_previous_text=False,

            temperature=0.0
        )

        text_parts = []

        for segment in segments:
            text = segment.text.strip()

            if text:
                text_parts.append(
                    text
                )

        final_text = " ".join(
            text_parts
        ).strip()

        return jsonify({
            "success": True,

            "text":
                final_text,

            "language":
                getattr(
                    info,
                    "language",
                    None
                ),

            "language_probability":
                getattr(
                    info,
                    "language_probability",
                    0
                )
        })

    except Exception as error:
        print(
            "Transcription error:",
            error
        )

        return jsonify({
            "success": False,
            "error": str(error)
        }), 500

    finally:
        if temp_path:
            try:
                os.remove(
                    temp_path
                )
            except Exception:
                pass


# ============================================================
# START
# ============================================================

if __name__ == "__main__":
    print(
        "Starting local voice server:"
    )

    print(
        "http://127.0.0.1:5001"
    )

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False,
        threaded=True
    )