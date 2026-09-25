/* =========================================
   NOVA ELEMENTS
========================================= */

const messageInput =
  document.getElementById('messageInput');

const sendButton =
  document.getElementById('sendButton');

const responseBox =
  document.getElementById('responseBox');

const commandFeed =
  document.getElementById('commandFeed');

const statusText =
  document.getElementById('statusText');

const activityStatus =
  document.getElementById('activityStatus');

const currentTask =
  document.getElementById('currentTask');

const novaCore =
  document.getElementById('novaCore');

const systemClock =
  document.getElementById('systemClock');

const systemDate =
  document.getElementById('systemDate');

const backendStatus =
  document.getElementById('backendStatus');

const aiStatus =
  document.getElementById('aiStatus');


/* RIGHT PANEL */

const weatherTemperature =
  document.getElementById('weatherTemperature');

const weatherCondition =
  document.getElementById('weatherCondition');

const weatherLocation =
  document.getElementById('weatherLocation');

const weatherHumidity =
  document.getElementById('weatherHumidity');

const weatherWind =
  document.getElementById('weatherWind');

const wifiName =
  document.getElementById('wifiName');

const wifiSignal =
  document.getElementById('wifiSignal');

const bluetoothDevice =
  document.getElementById('bluetoothDevice');

const bluetoothStatus =
  document.getElementById('bluetoothStatus');

const cpuUsage =
  document.getElementById('cpuUsage');

const ramUsage =
  document.getElementById('ramUsage');

const batteryLevel =
  document.getElementById('batteryLevel');

const newsList =
  document.getElementById('newsList');

const newsStatus =
  document.getElementById('newsStatus');

const posterImage =
  document.getElementById('posterImage');

const posterPlaceholder =
  document.getElementById('posterPlaceholder');

const posterCaption =
  document.getElementById('posterCaption');


/* =========================================
   CLOCK + DATE
========================================= */

function updateClock() {
  const now =
    new Date();

  systemClock.textContent =
    now.toLocaleTimeString(
      [],
      {
        hour:
          '2-digit',
        minute:
          '2-digit',
        second:
          '2-digit'
      }
    );

  systemDate.textContent =
    now.toLocaleDateString(
      [],
      {
        weekday:
          'long',
        day:
          '2-digit',
        month:
          'long',
        year:
          'numeric'
      }
    );
}

updateClock();

setInterval(
  updateClock,
  1000
);


/* =========================================
   CORE STATE
========================================= */

function setCoreState(
  state
) {
  novaCore.classList.remove(
    'thinking',
    'speaking',
    'error'
  );

  if (
    state ===
    'thinking'
  ) {
    novaCore.classList.add(
      'thinking'
    );
  }

  if (
    state ===
    'speaking'
  ) {
    novaCore.classList.add(
      'speaking'
    );
  }

  if (
    state ===
    'error'
  ) {
    novaCore.classList.add(
      'error'
    );
  }
}


/* =========================================
   COMMAND FEED
========================================= */

function createFeedCard(
  type,
  title,
  text
) {
  const card =
    document.createElement(
      'div'
    );

  card.className =
    `feed-card ${type}`;

  const header =
    document.createElement(
      'div'
    );

  header.className =
    'feed-card-header';

  header.textContent =
    title;

  const body =
    document.createElement(
      'div'
    );

  body.className =
    'feed-card-body';

  body.textContent =
    text;

  card.appendChild(
    header
  );

  card.appendChild(
    body
  );

  return card;
}


function scrollCommandFeed() {
  commandFeed.scrollTo({
    top:
      commandFeed.scrollHeight,

    behavior:
      'smooth'
  });
}


function addUserMessage(
  text
) {
  const card =
    createFeedCard(
      'user-message',
      'YOU',
      text
    );

  commandFeed.appendChild(
    card
  );

  scrollCommandFeed();
}


function addNovaMessage(
  text
) {
  responseBox.textContent =
    text;

  const card =
    createFeedCard(
      'nova-message',
      'NOVA',
      text
    );

  commandFeed.appendChild(
    card
  );

  scrollCommandFeed();
}


function addSystemMessage(
  text
) {
  const card =
    createFeedCard(
      'system-message',
      'SYSTEM',
      text
    );

  commandFeed.appendChild(
    card
  );

  scrollCommandFeed();
}


/* =========================================
   NOVA VOICE
========================================= */

function chooseNovaVoice() {
  const voices =
    window
      .speechSynthesis
      ?.getVoices() ||
    [];

  if (
    voices.length ===
    0
  ) {
    return null;
  }

  const preferredNames = [
    'Microsoft David',
    'Microsoft Mark',
    'Microsoft Zira'
  ];

  for (
    const preferred
    of preferredNames
  ) {
    const found =
      voices.find(
        (voice) =>
          voice.name
            .toLowerCase()
            .includes(
              preferred
                .toLowerCase()
            )
      );

    if (found) {
      return found;
    }
  }

  return (
    voices.find(
      (voice) =>
        voice.lang
          ?.toLowerCase()
          .startsWith('en')
    ) ||
    voices[0]
  );
}


function speakText(
  text
) {
  if (
    !text ||
    !(
      'speechSynthesis'
      in window
    )
  ) {
    return;
  }

  window
    .speechSynthesis
    .cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  const voice =
    chooseNovaVoice();

  if (voice) {
    utterance.voice =
      voice;
  }

  utterance.rate =
    1;

  utterance.pitch =
    0.88;

  utterance.volume =
    1;

  utterance.onstart =
    () => {

      setCoreState(
        'speaking'
      );

      activityStatus
        .textContent =
        'SPEAKING';

      currentTask
        .textContent =
        'VOICE RESPONSE';

      statusText
        .textContent =
        'NOVA SPEAKING';
    };

  utterance.onend =
    () => {

      setCoreState(
        'idle'
      );

      activityStatus
        .textContent =
        'IDLE';

      currentTask
        .textContent =
        'STANDBY';

      statusText
        .textContent =
        'SYSTEMS ONLINE';
    };

  utterance.onerror =
    () => {

      setCoreState(
        'idle'
      );

      activityStatus
        .textContent =
        'IDLE';

      statusText
        .textContent =
        'SYSTEMS ONLINE';
    };

  window
    .speechSynthesis
    .speak(
      utterance
    );
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {
  const message =
    messageInput
      .value
      .trim();

  if (!message) {
    return;
  }

  addUserMessage(
    message
  );

  messageInput.value =
    '';

  messageInput.disabled =
    true;

  sendButton.disabled =
    true;

  window
    .speechSynthesis
    ?.cancel();

  setCoreState(
    'thinking'
  );

  activityStatus.textContent =
    'THINKING';

  currentTask.textContent =
    message
      .toUpperCase()
      .slice(
        0,
        32
      );

  statusText.textContent =
    'PROCESSING COMMAND';

  aiStatus.textContent =
    'THINKING';

  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/chat',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              message
            })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
        'Nova request failed'
      );
    }

    const answer =
      data
        ?.response
        ?.content ||
      'Nova returned no text response.';

    addNovaMessage(
      answer
    );

    backendStatus.textContent =
      'ONLINE';

    aiStatus.textContent =
      'READY';

    speakText(
      answer
    );

  } catch (error) {
    console.error(
      error
    );

    addSystemMessage(
      'Unable to communicate with the Nova backend.'
    );

    setCoreState(
      'error'
    );

    backendStatus.textContent =
      'OFFLINE';

    aiStatus.textContent =
      'ERROR';

    activityStatus.textContent =
      'ERROR';

    currentTask.textContent =
      'CONNECTION FAILURE';

    statusText.textContent =
      'CONNECTION ERROR';

  } finally {
    messageInput.disabled =
      false;

    sendButton.disabled =
      false;

    messageInput.focus();
  }
}


/* =========================================
   WEATHER CODE
========================================= */

function weatherCodeToText(
  code
) {
  const weatherCodes = {
    0:
      'Clear sky',
    1:
      'Mostly clear',
    2:
      'Partly cloudy',
    3:
      'Overcast',
    45:
      'Fog',
    48:
      'Fog',
    51:
      'Light drizzle',
    53:
      'Drizzle',
    55:
      'Heavy drizzle',
    61:
      'Light rain',
    63:
      'Rain',
    65:
      'Heavy rain',
    71:
      'Light snow',
    73:
      'Snow',
    75:
      'Heavy snow',
    80:
      'Rain showers',
    81:
      'Rain showers',
    82:
      'Heavy showers',
    95:
      'Thunderstorm',
    96:
      'Thunderstorm',
    99:
      'Thunderstorm'
  };

  return (
    weatherCodes[code] ||
    'Weather'
  );
}


/* =========================================
   BLUETOOTH DEVICE PICKER
========================================= */

function findUsefulBluetoothDevice(
  bluetooth
) {
  const devices =
    bluetooth
      ?.active_devices ||
    bluetooth
      ?.devices ||
    [];

  if (
    !Array.isArray(
      devices
    )
  ) {
    return null;
  }

  const ignoredWords = [
    'intel',
    'generic',
    'service',
    'profile',
    'rfcomm',
    'transport',
    'enumerator',
    'adapter',
    'device information',
    'personal area',
    'phonebook',
    'object push',
    'sim access'
  ];

  return (
    devices.find(
      (device) => {
        const name =
          String(
            device
              ?.name ||
            ''
          ).trim();

        if (!name) {
          return false;
        }

        const lower =
          name.toLowerCase();

        return (
          !ignoredWords.some(
            (word) =>
              lower.includes(
                word
              )
          )
        );
      }
    ) ||
    null
  );
}


/* =========================================
   LIVE DASHBOARD
========================================= */

async function refreshDashboard() {
  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/dashboard'
      );

    if (
      !response.ok
    ) {
      throw new Error(
        'Dashboard request failed'
      );
    }

    const data =
      await response.json();

    backendStatus.textContent =
      'ONLINE';


    /* SYSTEM */

    const system =
      data?.system;

    if (
      system?.success
    ) {
      cpuUsage.textContent =
        `${system.cpu_usage_percent ?? '--'}%`;

      ramUsage.textContent =
        `${system.memory_usage_percent ?? '--'}%`;

      /*
        Your HTML currently has only
        CPU / RAM / BATTERY boxes.

        For now GPU name goes into
        the CPU title tooltip.
      */

      const gpu =
        Array.isArray(
          system.gpu
        )
          ? system.gpu[0]
          : null;

      if (gpu?.name) {
        cpuUsage.title =
          `GPU: ${gpu.name}`;
      }
    }


    /* BATTERY */

    const battery =
      data?.battery;

    if (
      battery
        ?.battery_present
    ) {
      batteryLevel.textContent =
        `${battery.percentage ?? '--'}%`;

      batteryLevel.title =
        battery.status ||
        'Battery';
    } else {
      batteryLevel.textContent =
        'N/A';
    }


    /* WIFI */

    const wifi =
      data?.wifi
        ?.current_connection;

    if (wifi) {
      wifiName.textContent =
        wifi.ssid ||
        'Connected';

      wifiSignal.textContent =
        wifi.signal ||
        '--';
    } else {
      wifiName.textContent =
        'Not connected';

      wifiSignal.textContent =
        '--';
    }


    /* BLUETOOTH */

    const bluetooth =
      data?.bluetooth;

    const btDevice =
      findUsefulBluetoothDevice(
        bluetooth
      );

    if (
      bluetooth
        ?.bluetooth_available
    ) {
      bluetoothStatus.textContent =
        'ON';

      bluetoothDevice.textContent =
        btDevice
          ?.name
          ?.trim() ||
        'Bluetooth active';

    } else {
      bluetoothStatus.textContent =
        'OFF';

      bluetoothDevice.textContent =
        'Unavailable';
    }


    /* WEATHER */

    const weather =
      data?.weather;

    if (
      weather &&
      weather.success !==
      false
    ) {
      weatherTemperature.textContent =
        `${
          weather.temperature_c ??
          '--'
        }°C`;

      weatherCondition.textContent =
        weatherCodeToText(
          weather.weather_code
        );

      weatherLocation.textContent =
        [
          weather.city,
          weather.country
        ]
          .filter(Boolean)
          .join(', ');

      weatherHumidity.textContent =
        `${
          weather.humidity_percent ??
          '--'
        }%`;

      weatherWind.textContent =
        `${
          weather.wind_speed_kmh ??
          '--'
        } km/h`;

    } else {
      weatherTemperature.textContent =
        '--°';

      weatherCondition.textContent =
        'Weather unavailable';

      weatherLocation.textContent =
        '';
    }

  } catch (error) {
    console.error(
      'Dashboard refresh error:',
      error
    );

    backendStatus.textContent =
      'OFFLINE';
  }
}


refreshDashboard();

setInterval(
  refreshDashboard,
  5000
);


/* =========================================
   BACKEND HEALTH
========================================= */

async function checkBackendHealth() {
  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/health'
      );

    if (
      !response.ok
    ) {
      throw new Error();
    }

    backendStatus.textContent =
      'ONLINE';

  } catch {
    backendStatus.textContent =
      'OFFLINE';
  }
}

checkBackendHealth();

setInterval(
  checkBackendHealth,
  10000
);


/* =========================================
   POSTER / MEME ROTATION
========================================= */

const mediaItems = [
  {
    file:
      './media/poster1.jpg',

    caption:
      'Nova Poster 01'
  },

  {
    file:
      './media/poster2.jpg',

    caption:
      'Nova Poster 02'
  },

  {
    file:
      './media/poster3.png',

    caption:
      'Nova Poster 03'
  },

  {
    file:
      './media/meme1.jpg',

    caption:
      'Meme 01'
  },

  {
    file:
      './media/meme2.jpg',

    caption:
      'Meme 02'
  },

  {
    file:
      './media/meme3.png',

    caption:
      'Meme 03'
  }
];

let currentMediaIndex =
  0;

let failedMediaCount =
  0;


function showPosterPlaceholder() {
  posterImage.style.display =
    'none';

  posterPlaceholder.style.display =
    'flex';

  posterCaption.textContent =
    'Add images to desktop/media/';
}


function displayMediaItem() {
  if (
    mediaItems.length ===
    0
  ) {
    showPosterPlaceholder();

    return;
  }

  const item =
    mediaItems[
      currentMediaIndex
    ];

  posterImage.onload =
    () => {
      failedMediaCount =
        0;

      posterPlaceholder
        .style
        .display =
        'none';

      posterImage
        .style
        .display =
        'block';

      posterCaption
        .textContent =
        item.caption;
    };

  posterImage.onerror =
    () => {
      failedMediaCount++;

      if (
        failedMediaCount >=
        mediaItems.length
      ) {
        showPosterPlaceholder();

        return;
      }

      currentMediaIndex =
        (
          currentMediaIndex +
          1
        ) %
        mediaItems.length;

      displayMediaItem();
    };

  posterImage.style.display =
    'none';

  posterImage.src =
    item.file;
}


function nextMediaItem() {
  currentMediaIndex =
    (
      currentMediaIndex +
      1
    ) %
    mediaItems.length;

  failedMediaCount =
    0;

  displayMediaItem();
}

displayMediaItem();

setInterval(
  nextMediaItem,
  8000
);


/* =========================================
   NEWS PLACEHOLDER
========================================= */

function initializeNews() {
  newsStatus.textContent =
    'WAIT';

  newsList.innerHTML =
    '';

  const item =
    document.createElement(
      'div'
    );

  item.className =
    'news-item';

  item.textContent =
    'News backend coming next...';

  newsList.appendChild(
    item
  );
}

initializeNews();


/* =========================================
   EVENTS
========================================= */

sendButton.addEventListener(
  'click',
  sendMessage
);

messageInput.addEventListener(
  'keydown',
  (event) => {
    if (
      event.key ===
      'Enter'
    ) {
      sendMessage();
    }
  }
);


/* =========================================
   INITIALIZATION
========================================= */

window
  .speechSynthesis
  ?.getVoices();

if (
  window
    .speechSynthesis
) {
  window
    .speechSynthesis
    .onvoiceschanged =
      () => {
        window
          .speechSynthesis
          .getVoices();
      };
}

messageInput.focus();