#!/data/data/com.termux/files/usr/bin/bash

echo "ðŸŽ™ï¸ NOVA voice mode started"
echo "Press ENTER, then speak. CTRL+C to exit."

while true; do
    read -r

    echo "Listening..."

    TEXT=$(termux-speech-to-text)

    if [ -z "$TEXT" ]; then
        echo "I didn't hear anything."
        continue
    fi

    echo "You: $TEXT"

    RESPONSE=$(python -c 'import json,sys; print(json.dumps({"message":sys.stdin.read().strip()}))' <<< "$TEXT")

    RESULT=$(curl -s -X POST http://127.0.0.1:3000/chat \
        -H 'Content-Type: application/json' \
        -d "$RESPONSE")

    ANSWER=$(python -c '
import json,sys
try:
    data=json.load(sys.stdin)
    print(data["response"]["content"] or "")
except Exception:
    print("Sorry, I could not process that.")
' <<< "$RESULT")

    echo "NOVA: $ANSWER"

    if [ -n "$ANSWER" ]; then
        termux-tts-speak "$ANSWER"
    fi
done

