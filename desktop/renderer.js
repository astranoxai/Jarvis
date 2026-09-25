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
   CLOCK
========================================= */

function updateClock() {
  const now =
    new Date();

  if (systemClock) {
    systemClock.textContent =
      now.toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }
      );
  }

  if (systemDate) {
    systemDate.textContent =
      now.toLocaleDateString(
        [],
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      );
  }
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
  if (!novaCore) {
    return;
  }

  novaCore.classList.remove(
    'thinking',
    'speaking',
    'error'
  );

  if (
    state === 'thinking' ||
    state === 'speaking' ||
    state === 'error'
  ) {
    novaCore.classList.add(
      state
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
  if (!commandFeed) {
    return;
  }

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
  if (!commandFeed) {
    return;
  }

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


let firstNovaMessageUsed =
  false;


function addNovaMessage(
  text
) {
  if (
    !firstNovaMessageUsed &&
    responseBox
  ) {
    responseBox.textContent =
      text;

    firstNovaMessageUsed =
      true;

    scrollCommandFeed();

    return;
  }

  if (!commandFeed) {
    return;
  }

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
  if (!commandFeed) {
    return;
  }

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
    voices.length === 0
  ) {
    return null;
  }

  const preferredNames = [
    'Microsoft David',
    'Microsoft Mark',
    'Microsoft Zira'
  ];

  for (
    const preferredName
    of preferredNames
  ) {
    const voice =
      voices.find(
        (item) =>
          item.name
            .toLowerCase()
            .includes(
              preferredName
                .toLowerCase()
            )
      );

    if (voice) {
      return voice;
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

      if (activityStatus) {
        activityStatus.textContent =
          'SPEAKING';
      }

      if (currentTask) {
        currentTask.textContent =
          'VOICE RESPONSE';
      }

      if (statusText) {
        statusText.textContent =
          'NOVA SPEAKING';
      }
    };

  utterance.onend =
    () => {
      setCoreState(
        'idle'
      );

      if (activityStatus) {
        activityStatus.textContent =
          'IDLE';
      }

      if (currentTask) {
        currentTask.textContent =
          'STANDBY';
      }

      if (statusText) {
        statusText.textContent =
          'SYSTEMS ONLINE';
      }
    };

  utterance.onerror =
    () => {
      setCoreState(
        'idle'
      );

      if (activityStatus) {
        activityStatus.textContent =
          'IDLE';
      }
    };

  window
    .speechSynthesis
    .speak(
      utterance
    );
}


/* =========================================
   CHAT
========================================= */

async function sendMessage() {
  const message =
    messageInput
      ?.value
      ?.trim();

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

  if (activityStatus) {
    activityStatus.textContent =
      'THINKING';
  }

  if (currentTask) {
    currentTask.textContent =
      message
        .toUpperCase()
        .slice(
          0,
          32
        );
  }

  if (statusText) {
    statusText.textContent =
      'PROCESSING COMMAND';
  }

  if (aiStatus) {
    aiStatus.textContent =
      'THINKING';
  }

  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/chat',
        {
          method: 'POST',

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

    if (!response.ok) {
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

    if (backendStatus) {
      backendStatus.textContent =
        'ONLINE';
    }

    if (aiStatus) {
      aiStatus.textContent =
        'READY';
    }

    speakText(
      answer
    );

  } catch (error) {
    console.error(
      'Chat error:',
      error
    );

    addSystemMessage(
      'Unable to communicate with the Nova backend.'
    );

    setCoreState(
      'error'
    );

    if (backendStatus) {
      backendStatus.textContent =
        'OFFLINE';
    }

    if (aiStatus) {
      aiStatus.textContent =
        'ERROR';
    }

    if (activityStatus) {
      activityStatus.textContent =
        'ERROR';
    }

    if (currentTask) {
      currentTask.textContent =
        'CONNECTION FAILURE';
    }

    if (statusText) {
      statusText.textContent =
        'CONNECTION ERROR';
    }

  } finally {
    messageInput.disabled =
      false;

    sendButton.disabled =
      false;

    messageInput.focus();
  }
}


/* =========================================
   WEATHER
========================================= */

function weatherCodeToText(
  code
) {
  const map = {
    0: 'Clear',
    1: 'Mostly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',

    45: 'Fog',
    48: 'Fog',

    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',

    56: 'Freezing Drizzle',
    57: 'Freezing Drizzle',

    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',

    66: 'Freezing Rain',
    67: 'Freezing Rain',

    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',

    77: 'Snow Grains',

    80: 'Rain Showers',
    81: 'Rain Showers',
    82: 'Heavy Showers',

    85: 'Snow Showers',
    86: 'Heavy Snow Showers',

    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  };

  return (
    map[code] ||
    'Unknown'
  );
}


function updateWeather(
  weather
) {
  if (
    !weather ||
    weather.success !== true
  ) {
    if (weatherTemperature) {
      weatherTemperature.textContent =
        '--°C';
    }

    if (weatherCondition) {
      weatherCondition.textContent =
        'Unavailable';
    }

    if (weatherLocation) {
      weatherLocation.textContent =
        '';
    }

    if (weatherHumidity) {
      weatherHumidity.textContent =
        '--';
    }

    if (weatherWind) {
      weatherWind.textContent =
        '--';
    }

    return;
  }

  if (weatherTemperature) {
    weatherTemperature.textContent =
      `${weather.temperature_c ?? '--'}°C`;
  }

  if (weatherCondition) {
    weatherCondition.textContent =
      weatherCodeToText(
        weather.weather_code
      );
  }

  if (weatherLocation) {
    weatherLocation.textContent =
      [
        weather.city,
        weather.region,
        weather.country
      ]
        .filter(Boolean)
        .join(', ');
  }

  if (weatherHumidity) {
    weatherHumidity.textContent =
      `${weather.humidity_percent ?? '--'}%`;
  }

  if (weatherWind) {
    weatherWind.textContent =
      `${weather.wind_speed_kmh ?? '--'} km/h`;
  }
}


/* =========================================
   BLUETOOTH
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
            device?.name ||
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
   NEWS
========================================= */

function formatNewsTime(
  published
) {
  if (!published) {
    return '';
  }

  const date =
    new Date(
      published
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}


function updateNews(
  news
) {
  if (!newsList) {
    return;
  }

  newsList.innerHTML =
    '';

  if (
    !news ||
    news.success !== true ||
    !Array.isArray(
      news.headlines
    ) ||
    news.headlines.length === 0
  ) {
    if (newsStatus) {
      newsStatus.textContent =
        'OFFLINE';
    }

    const empty =
      document.createElement(
        'div'
      );

    empty.className =
      'news-item';

    empty.textContent =
      'No live headlines available.';

    newsList.appendChild(
      empty
    );

    return;
  }

  if (newsStatus) {
    newsStatus.textContent =
      'LIVE';
  }

  for (
    const headline
    of news.headlines
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'news-item';

    const title =
      document.createElement(
        'div'
      );

    title.className =
      'news-title';

    title.textContent =
      headline.title ||
      'Untitled headline';

    const metadata =
      document.createElement(
        'div'
      );

    metadata.className =
      'news-meta';

    const source =
      headline.source ||
      'News';

    const time =
      formatNewsTime(
        headline.published
      );

    metadata.textContent =
      time
        ? `${source} • ${time}`
        : source;

    item.appendChild(
      title
    );

    item.appendChild(
      metadata
    );

    newsList.appendChild(
      item
    );
  }
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

    if (!response.ok) {
      throw new Error(
        'Dashboard request failed'
      );
    }

    const data =
      await response.json();

    if (backendStatus) {
      backendStatus.textContent =
        'ONLINE';
    }


    /* SYSTEM */

    const system =
      data?.system;

    if (
      system?.success ===
      true
    ) {
      if (cpuUsage) {
        cpuUsage.textContent =
          `${system.cpu_usage_percent ?? '--'}%`;
      }

      if (ramUsage) {
        ramUsage.textContent =
          `${system.memory_usage_percent ?? '--'}%`;
      }

      const gpu =
        Array.isArray(
          system.gpu
        )
          ? system.gpu[0]
          : null;

      if (
        gpu &&
        cpuUsage
      ) {
        cpuUsage.title =
          `GPU: ${gpu.name || 'Unknown'} | ${gpu.memory_gb ?? '--'} GB`;
      }
    }


    /* BATTERY */

    const battery =
      data?.battery;

    if (
      battery
        ?.battery_present
    ) {
      if (batteryLevel) {
        batteryLevel.textContent =
          `${battery.percentage ?? '--'}%`;

        batteryLevel.title =
          battery.status ||
          'Battery';
      }

    } else if (
      batteryLevel
    ) {
      batteryLevel.textContent =
        'N/A';
    }


    /* WIFI */

    const wifi =
      data
        ?.wifi
        ?.current_connection;

    if (wifi) {
      if (wifiName) {
        wifiName.textContent =
          wifi.ssid ||
          'Connected';
      }

      if (wifiSignal) {
        wifiSignal.textContent =
          wifi.signal ||
          '--';
      }

    } else {
      if (wifiName) {
        wifiName.textContent =
          'Not connected';
      }

      if (wifiSignal) {
        wifiSignal.textContent =
          '--';
      }
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
      if (bluetoothStatus) {
        bluetoothStatus.textContent =
          'AVAILABLE';
      }

      if (bluetoothDevice) {
        bluetoothDevice.textContent =
          btDevice
            ?.name
            ?.trim() ||
          'Bluetooth enabled';
      }

    } else {
      if (bluetoothStatus) {
        bluetoothStatus.textContent =
          'OFF';
      }

      if (bluetoothDevice) {
        bluetoothDevice.textContent =
          'Unavailable';
      }
    }


    /* WEATHER */

    updateWeather(
      data?.weather
    );


    /* NEWS */

    updateNews(
      data?.news
    );

  } catch (error) {
    console.error(
      'Dashboard refresh error:',
      error
    );

    if (backendStatus) {
      backendStatus.textContent =
        'OFFLINE';
    }

    if (newsStatus) {
      newsStatus.textContent =
        'OFFLINE';
    }
  }
}


refreshDashboard();

setInterval(
  refreshDashboard,
  5000
);


/* =========================================
   HEALTH CHECK
========================================= */

async function checkBackendHealth() {
  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/health'
      );

    if (!response.ok) {
      throw new Error();
    }

    if (backendStatus) {
      backendStatus.textContent =
        'ONLINE';
    }

  } catch {
    if (backendStatus) {
      backendStatus.textContent =
        'OFFLINE';
    }
  }
}

checkBackendHealth();

setInterval(
  checkBackendHealth,
  10000
);


/* =========================================
   MEDIA ROTATION
========================================= */

const mediaItems = [
  {
    file:
      './media/poster1.jpg',

    caption:
      'NOVA // POSTER 01'
  },

  {
    file:
      './media/poster2.jpg',

    caption:
      'NOVA // POSTER 02'
  },

  {
    file:
      './media/poster3.png',

    caption:
      'NOVA // POSTER 03'
  },

  {
    file:
      './media/meme1.jpg',

    caption:
      'MEME // 01'
  },

  {
    file:
      './media/meme2.jpg',

    caption:
      'MEME // 02'
  },

  {
    file:
      './media/meme3.png',

    caption:
      'MEME // 03'
  }
];

let currentMediaIndex =
  0;

let failedMediaCount =
  0;


function showPosterPlaceholder() {
  if (posterImage) {
    posterImage.style.display =
      'none';
  }

  if (posterPlaceholder) {
    posterPlaceholder.style.display =
      'flex';
  }

  if (posterCaption) {
    posterCaption.textContent =
      'Add images to desktop/media/';
  }
}


function displayMediaItem() {
  if (
    !posterImage ||
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

      if (posterPlaceholder) {
        posterPlaceholder.style.display =
          'none';
      }

      posterImage.style.display =
        'block';

      if (posterCaption) {
        posterCaption.textContent =
          item.caption;
      }
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
   EVENTS
========================================= */

sendButton?.addEventListener(
  'click',
  sendMessage
);


messageInput?.addEventListener(
  'keydown',
  (event) => {
    if (
      event.key ===
      'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();

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


if (newsStatus) {
  newsStatus.textContent =
    'SYNCING';
}


if (messageInput) {
  messageInput.focus();
}