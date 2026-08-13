#!/data/data/com.termux/files/usr/bin/bash

echo "🤖 JARVIS wake mode"
echo 'Say "Wake up" to activate.'
echo "Press CTRL+C to stop."

while true; do
    echo
    echo "👂 Listening for wake phrase..."

    TEXT=$(termux-speech-to-text | tr '[:upper:]' '[:lower:]' | xargs)

    if [ -z "$TEXT" ]; then
        continue
    fi

    echo "Heard: $TEXT"

    if [[ "$TEXT" == "wake" ]] ||
       [[ "$TEXT" == "up" ]] ||
       [[ "$TEXT" == "wake up" ]] ||
       [[ "$TEXT" == *"wake up"* ]] ||
       [[ "$TEXT" == *"jarvis"* ]]; then

        echo "🎙️ Wake detected!"
        termux-tts-speak "Yes?"

        echo "👂 Listening for command..."

        COMMAND=$(termux-speech-to-text)

        if [ -z "$COMMAND" ]; then
            termux-tts-speak "I didn't hear a command."
            continue
        fi

        echo "You: $COMMAND"

        JSON=$(python -c 'import json,sys; print(json.dumps({"message":sys.stdin.read().strip()}))' <<< "$COMMAND")

        RESULT=$(curl -s -X POST http://127.0.0.1:3000/chat \
            -H 'Content-Type: application/json' \
            -d "$JSON")

        ANSWER=$(python -c '
import json,sys
try:
    data=json.load(sys.stdin)
    print(data["response"]["content"] or "")
except Exception:
    print("Sorry, I could not process that.")
' <<< "$RESULT")

        echo "JARVIS: $ANSWER"

        if [ -n "$ANSWER" ]; then
            termux-tts-speak "$ANSWER"
        fi
    fi
done
