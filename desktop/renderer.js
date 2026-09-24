const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const responseBox = document.getElementById('responseBox');
const statusText = document.getElementById('statusText');
const activityStatus = document.getElementById('activityStatus');
const currentTask = document.getElementById('currentTask');
const jarvisCore = document.getElementById('jarvisCore');
const systemClock = document.getElementById('systemClock');

function updateClock() {
  const now = new Date();

  systemClock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

updateClock();
setInterval(updateClock, 1000);

function setCoreState(state) {
  jarvisCore.classList.remove('thinking', 'error');

  if (state === 'thinking') {
    jarvisCore.classList.add('thinking');
  }

  if (state === 'error') {
    jarvisCore.classList.add('error');
  }
}

async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    return;
  }

  messageInput.disabled = true;
  sendButton.disabled = true;

  setCoreState('thinking');

  activityStatus.textContent = 'THINKING';
  currentTask.textContent = message.toUpperCase().slice(0, 35);

  statusText.textContent = 'PROCESSING COMMAND';
  responseBox.textContent = 'Processing command...';

  try {
    const response = await fetch('http://127.0.0.1:3000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'JARVIS request failed');
    }

    const answer =
      data?.response?.content ||
      'JARVIS returned no text response.';

    responseBox.textContent = answer;

    setCoreState('idle');

    activityStatus.textContent = 'IDLE';
    currentTask.textContent = 'STANDBY';

    statusText.textContent = 'SYSTEMS ONLINE';

    messageInput.value = '';
  } catch (error) {
    console.error(error);

    setCoreState('error');

    activityStatus.textContent = 'ERROR';
    currentTask.textContent = 'CONNECTION FAILURE';

    statusText.textContent = 'CONNECTION ERROR';

    responseBox.textContent =
      'Unable to communicate with the JARVIS backend.';
  } finally {
    messageInput.disabled = false;
    sendButton.disabled = false;

    messageInput.focus();
  }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

messageInput.focus();