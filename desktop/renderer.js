/* =========================================
   NOVA DESKTOP RENDERER
========================================= */

const $ =
  id =>
    document.getElementById(id);


/* =========================================
   MAIN ELEMENTS
========================================= */

const messageInput =
  $('messageInput');

const sendButton =
  $('sendButton');

const responseBox =
  $('responseBox');

const commandFeed =
  $('commandFeed');

const statusText =
  $('statusText');

const activityStatus =
  $('activityStatus');

const currentTask =
  $('currentTask');

const novaCore =
  $('novaCore');

const backendStatus =
  $('backendStatus');

const aiStatus =
  $('aiStatus');

const systemClock =
  $('systemClock');

const systemDate =
  $('systemDate');


/* =========================================
   DASHBOARD
========================================= */

const weatherTemperature =
  $('weatherTemperature');

const weatherCondition =
  $('weatherCondition');

const weatherLocation =
  $('weatherLocation');

const weatherHumidity =
  $('weatherHumidity');

const weatherWind =
  $('weatherWind');

const wifiName =
  $('wifiName');

const wifiSignal =
  $('wifiSignal');

const bluetoothDevice =
  $('bluetoothDevice');

const bluetoothStatus =
  $('bluetoothStatus');

const cpuUsage =
  $('cpuUsage');

const ramUsage =
  $('ramUsage');

const batteryLevel =
  $('batteryLevel');

const newsList =
  $('newsList');

const newsStatus =
  $('newsStatus');


/* =========================================
   MEDIA
========================================= */

const posterImage =
  $('posterImage');

const posterPlaceholder =
  $('posterPlaceholder');

const posterCaption =
  $('posterCaption');


/* =========================================
   SETTINGS
========================================= */

const settingsButton =
  $('settingsButton');

const settingsOverlay =
  $('settingsOverlay');

const closeSettingsButton =
  $('closeSettingsButton');

const settingsSaveStatus =
  $('settingsSaveStatus');


/* =========================================
   NOTIFICATIONS
========================================= */

const notificationsButton =
  $('notificationsButton');

const notificationPanel =
  $('notificationPanel');

const closeNotificationsButton =
  $('closeNotificationsButton');

const notificationList =
  $('notificationList');

const notificationBadge =
  $('notificationBadge');


/* =========================================
   CAMERA
========================================= */

const cameraCard =
  $('cameraCard');

const cameraPreview =
  $('cameraPreview');

const cameraPlaceholder =
  $('cameraPlaceholder');

const cameraDeviceName =
  $('cameraDeviceName');

const cameraHeaderStatus =
  $('cameraHeaderStatus');

const cameraLiveBadge =
  $('cameraLiveBadge');


/* =========================================
   SETTINGS INPUTS
========================================= */

const cameraEnabledSetting =
  $('cameraEnabledSetting');

const cameraSidebarSetting =
  $('cameraSidebarSetting');

const cameraMirrorSetting =
  $('cameraMirrorSetting');

const cameraDeviceSelect =
  $('cameraDeviceSelect');

const mediaRotationSetting =
  $('mediaRotationSetting');

const mediaRotationSpeedSetting =
  $('mediaRotationSpeedSetting');

const desktopNotificationsSetting =
  $('desktopNotificationsSetting');

const batteryNotificationsSetting =
  $('batteryNotificationsSetting');

const newsNotificationsSetting =
  $('newsNotificationsSetting');

const startupSetting =
  $('startupSetting');

const traySetting =
  $('traySetting');

const enhancedAnimationsSetting =
  $('enhancedAnimationsSetting');

const voiceRepliesSetting =
  $('voiceRepliesSetting');

const voiceStatus =
  $('voiceStatus');


/* =========================================
   SETTINGS DATA
========================================= */

const defaultSettings = {
  cameraEnabled: false,
  cameraSidebar: false,
  cameraMirror: true,
  cameraDevice: '',

  mediaRotation: true,
  mediaRotationSpeed: 8000,

  desktopNotifications: true,
  batteryNotifications: true,
  newsNotifications: false,

  startup: false,
  tray: true,

  enhancedAnimations: true,
  voiceReplies: true
};


let settings =
  loadSettings();


function loadSettings() {
  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          'nova-settings'
        ) ||
        '{}'
      );

    return {
      ...defaultSettings,
      ...saved
    };

  } catch {
    return {
      ...defaultSettings
    };
  }
}


function saveSettings() {
  localStorage.setItem(
    'nova-settings',
    JSON.stringify(settings)
  );

  if (settingsSaveStatus) {
    settingsSaveStatus.textContent =
      'Settings saved.';

    setTimeout(
      () => {
        settingsSaveStatus.textContent =
          'Settings saved automatically.';
      },
      1200
    );
  }
}


function loadSettingsIntoUI() {
  cameraEnabledSetting.checked =
    settings.cameraEnabled;

  cameraSidebarSetting.checked =
    settings.cameraSidebar;

  cameraMirrorSetting.checked =
    settings.cameraMirror;

  mediaRotationSetting.checked =
    settings.mediaRotation;

  mediaRotationSpeedSetting.value =
    String(
      settings.mediaRotationSpeed
    );

  desktopNotificationsSetting.checked =
    settings.desktopNotifications;

  batteryNotificationsSetting.checked =
    settings.batteryNotifications;

  newsNotificationsSetting.checked =
    settings.newsNotifications;

  startupSetting.checked =
    settings.startup;

  traySetting.checked =
    settings.tray;

  enhancedAnimationsSetting.checked =
    settings.enhancedAnimations;

  voiceRepliesSetting.checked =
    settings.voiceReplies;

  applyAnimationSetting();

  updateVoiceStatus();
}


/* =========================================
   SETTINGS PANEL
========================================= */

function openSettings() {
  settingsOverlay.hidden =
    false;

  document.body.classList.add(
    'modal-open'
  );
}


function closeSettings() {
  settingsOverlay.hidden =
    true;

  document.body.classList.remove(
    'modal-open'
  );
}


settingsButton
  ?.addEventListener(
    'click',
    openSettings
  );


closeSettingsButton
  ?.addEventListener(
    'click',
    closeSettings
  );


settingsOverlay
  ?.addEventListener(
    'click',
    event => {
      if (
        event.target ===
        settingsOverlay
      ) {
        closeSettings();
      }
    }
  );


/* =========================================
   NOTIFICATIONS
========================================= */

let notifications =
  [];

let unreadNotifications =
  0;


function renderNotifications() {
  notificationList.innerHTML =
    '';

  if (
    notifications.length ===
    0
  ) {
    const empty =
      document.createElement(
        'div'
      );

    empty.className =
      'notification-empty';

    empty.textContent =
      'No notifications.';

    notificationList.appendChild(
      empty
    );

  } else {
    for (
      const notification
      of notifications
    ) {
      const card =
        document.createElement(
          'div'
        );

      card.className =
        'notification-entry';


      const title =
        document.createElement(
          'div'
        );

      title.className =
        'notification-entry-title';

      title.textContent =
        notification.title;


      const body =
        document.createElement(
          'div'
        );

      body.className =
        'notification-entry-body';

      body.textContent =
        notification.body;


      const time =
        document.createElement(
          'div'
        );

      time.className =
        'notification-entry-time';

      time.textContent =
        notification.time;


      card.append(
        title,
        body,
        time
      );


      notificationList.appendChild(
        card
      );
    }
  }


  if (
    unreadNotifications >
    0
  ) {
    notificationBadge.hidden =
      false;

    notificationBadge.textContent =
      String(
        unreadNotifications
      );

  } else {
    notificationBadge.hidden =
      true;
  }
}


function addNotification(
  title,
  body,
  desktop = true
) {
  notifications.unshift({
    title,
    body,

    time:
      new Date()
        .toLocaleTimeString()
  });


  notifications =
    notifications.slice(
      0,
      40
    );


  unreadNotifications++;


  renderNotifications();


  if (
    desktop &&
    settings.desktopNotifications
  ) {
    window.novaAPI
      ?.showNotification({
        title,
        body
      });
  }
}


function openNotifications() {
  notificationPanel.hidden =
    false;

  unreadNotifications =
    0;

  renderNotifications();
}


function closeNotifications() {
  notificationPanel.hidden =
    true;
}


notificationsButton
  ?.addEventListener(
    'click',
    openNotifications
  );


closeNotificationsButton
  ?.addEventListener(
    'click',
    closeNotifications
  );


renderNotifications();


/* =========================================
   CLOCK
========================================= */

function updateClock() {
  const now =
    new Date();


  systemClock.textContent =
    now.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
    );


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
    [
      'thinking',
      'speaking',
      'error'
    ].includes(state)
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
  titleText,
  text
) {
  const card =
    document.createElement(
      'div'
    );


  card.className =
    `feed-card ${type}`;


  const title =
    document.createElement(
      'div'
    );


  title.className =
    'feed-card-header';


  title.textContent =
    titleText;


  const body =
    document.createElement(
      'div'
    );


  body.className =
    'feed-card-body';


  body.textContent =
    text;


  card.append(
    title,
    body
  );


  return card;
}


function scrollFeed() {
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
  commandFeed.appendChild(
    createFeedCard(
      'user-message',
      'YOU',
      text
    )
  );


  scrollFeed();
}


function addNovaMessage(
  text
) {
  responseBox.textContent =
    text;


  commandFeed.appendChild(
    createFeedCard(
      'nova-message',
      'NOVA',
      text
    )
  );


  scrollFeed();
}


function addSystemMessage(
  text
) {
  commandFeed.appendChild(
    createFeedCard(
      'system-message',
      'SYSTEM',
      text
    )
  );


  scrollFeed();
}


/* =========================================
   VOICE
========================================= */

function updateVoiceStatus() {
  if (!voiceStatus) {
    return;
  }


  voiceStatus.textContent =
    settings.voiceReplies
      ? 'ENABLED'
      : 'OFF';
}


function chooseNovaVoice() {
  const voices =
    speechSynthesis
      .getVoices();


  return (
    voices.find(
      voice =>
        /Microsoft (David|Mark|Zira)/i
          .test(
            voice.name
          )
    ) ||

    voices.find(
      voice =>
        voice.lang
          ?.toLowerCase()
          .startsWith(
            'en'
          )
    ) ||

    voices[0]
  );
}


function speakText(
  text
) {
  if (
    !settings.voiceReplies ||
    !text
  ) {
    return;
  }


  speechSynthesis.cancel();


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


  utterance.onstart =
    () => {
      setCoreState(
        'speaking'
      );


      activityStatus.textContent =
        'SPEAKING';


      statusText.textContent =
        'NOVA SPEAKING';
    };


  utterance.onend =
    () => {
      setCoreState(
        'idle'
      );


      activityStatus.textContent =
        'IDLE';


      statusText.textContent =
        'SYSTEMS ONLINE';
    };


  speechSynthesis.speak(
    utterance
  );
}


/* =========================================
   CAMERA
========================================= */

let cameraStream =
  null;


async function stopCamera() {
  if (cameraStream) {
    cameraStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    cameraStream =
      null;
  }


  if (cameraPreview) {
    cameraPreview.srcObject =
      null;
  }


  cameraHeaderStatus.textContent =
    'OFF';


  cameraPlaceholder.hidden =
    false;


  cameraPlaceholder.textContent =
    'CAMERA OFF';


  cameraLiveBadge.textContent =
    'OFF';


  cameraDeviceName.textContent =
    'No camera selected';
}


async function populateCameraDevices() {
  try {
    const devices =
      await navigator
        .mediaDevices
        .enumerateDevices();


    const cameras =
      devices.filter(
        device =>
          device.kind ===
          'videoinput'
      );


    cameraDeviceSelect.innerHTML =
      '';


    const defaultOption =
      document.createElement(
        'option'
      );


    defaultOption.value =
      '';


    defaultOption.textContent =
      'Default Camera';


    cameraDeviceSelect.appendChild(
      defaultOption
    );


    cameras.forEach(
      (
        camera,
        index
      ) => {
        const option =
          document.createElement(
            'option'
          );


        option.value =
          camera.deviceId;


        option.textContent =
          camera.label ||
          `Camera ${index + 1}`;


        cameraDeviceSelect.appendChild(
          option
        );
      }
    );


    cameraDeviceSelect.value =
      settings.cameraDevice ||
      '';

  } catch (
    error
  ) {
    console.error(
      'Camera listing failed:',
      error
    );
  }
}


function applyCameraMirror() {
  if (!cameraPreview) {
    return;
  }


  cameraPreview.style.transform =
    settings.cameraMirror
      ? 'scaleX(-1)'
      : 'scaleX(1)';
}


function updateCameraCardVisibility() {
  cameraCard.hidden =
    !(
      settings.cameraEnabled &&
      settings.cameraSidebar
    );
}


async function startCamera() {
  if (
    !settings.cameraEnabled
  ) {
    await stopCamera();

    updateCameraCardVisibility();

    return;
  }


  try {
    await stopCamera();


    const videoConstraints =
      settings.cameraDevice
        ? {
            deviceId: {
              exact:
                settings.cameraDevice
            },

            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            }
          }

        : {
            width: {
              ideal: 1280
            },

            height: {
              ideal: 720
            }
          };


    cameraStream =
      await navigator
        .mediaDevices
        .getUserMedia({
          video:
            videoConstraints,

          audio:
            false
        });


    cameraPreview.srcObject =
      cameraStream;


    await cameraPreview.play();


    cameraHeaderStatus.textContent =
      'ACTIVE';


    cameraHeaderStatus.classList.add(
      'online'
    );


    cameraPlaceholder.hidden =
      true;


    cameraLiveBadge.textContent =
      'ACTIVE';


    applyCameraMirror();


    updateCameraCardVisibility();


    await populateCameraDevices();


    const track =
      cameraStream
        .getVideoTracks()[0];


    cameraDeviceName.textContent =
      track?.label ||
      'Camera active';


  } catch (
    error
  ) {
    console.error(
      'Camera error:',
      error
    );


    cameraStream =
      null;


    settings.cameraEnabled =
      false;


    cameraEnabledSetting.checked =
      false;


    saveSettings();


    cameraHeaderStatus.textContent =
      'ERROR';


    cameraHeaderStatus.classList.remove(
      'online'
    );


    cameraPlaceholder.hidden =
      false;


    cameraPlaceholder.textContent =
      'CAMERA UNAVAILABLE';


    addNotification(
      'Camera Error',
      'NOVA could not access the webcam.',
      false
    );
  }
}


/* =========================================
   CAMERA VISION
========================================= */

/*
   NOVA does NOT constantly upload video.

   A single JPEG frame is captured only
   when:
   1. the camera is enabled, AND
   2. the user's message looks like a request
      to inspect what the camera can see.
*/

function isVisionRequest(
  message
) {
  const text =
    message
      .toLowerCase()
      .trim();


  const visionPatterns = [
    /\bcan you see\b/,
    /\bdo you see\b/,
    /\bwhat do you see\b/,
    /\bwhat can you see\b/,
    /\blook at me\b/,
    /\blook at this\b/,
    /\blook through\b/,
    /\blook at the camera\b/,
    /\bsee me\b/,
    /\bdescribe me\b/,
    /\bdescribe what you see\b/,
    /\bdescribe the camera\b/,
    /\bwhat am i holding\b/,
    /\bwhat is in front of\b/,
    /\bwhat's in front of\b/,
    /\bidentify this\b/,
    /\brecognize this\b/,
    /\bcheck the camera\b/,
    /\buse the camera\b/,
    /\buse camera\b/,
    /\bcamera view\b/,
    /\bwebcam\b/
  ];


  return visionPatterns.some(
    pattern =>
      pattern.test(text)
  );
}


function cameraIsReady() {
  return Boolean(
    settings.cameraEnabled &&
    cameraStream &&
    cameraPreview &&
    cameraPreview.readyState >= 2 &&
    cameraPreview.videoWidth > 0 &&
    cameraPreview.videoHeight > 0
  );
}


function captureCameraFrame() {
  if (
    !cameraIsReady()
  ) {
    return null;
  }


  /*
     Keep the image reasonably small.

     The actual webcam can still display
     at higher resolution in the sidebar.
  */

  const targetWidth =
    640;


  const sourceWidth =
    cameraPreview.videoWidth;


  const sourceHeight =
    cameraPreview.videoHeight;


  const ratio =
    sourceHeight /
    sourceWidth;


  const targetHeight =
    Math.max(
      1,
      Math.round(
        targetWidth *
        ratio
      )
    );


  const canvas =
    document.createElement(
      'canvas'
    );


  canvas.width =
    targetWidth;


  canvas.height =
    targetHeight;


  const context =
    canvas.getContext(
      '2d'
    );


  if (!context) {
    return null;
  }


  /*
     We intentionally capture the actual
     camera orientation, not the CSS mirrored
     sidebar preview.
  */

  context.drawImage(
    cameraPreview,
    0,
    0,
    targetWidth,
    targetHeight
  );


  return canvas.toDataURL(
    'image/jpeg',
    0.72
  );
}


/* =========================================
   CHAT
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


  speechSynthesis.cancel();


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
        34
      );


  statusText.textContent =
    'PROCESSING COMMAND';


  aiStatus.textContent =
    'THINKING';


  try {
    let cameraImage =
      null;


    const wantsVision =
      isVisionRequest(
        message
      );


    if (
      wantsVision
    ) {
      if (
        !settings.cameraEnabled
      ) {
        addSystemMessage(
          'Camera vision requested, but the camera is disabled. Enable Camera in Settings first.'
        );

      } else if (
        !cameraIsReady()
      ) {
        addSystemMessage(
          'Camera is enabled but not ready yet.'
        );

      } else {
        cameraImage =
          captureCameraFrame();


        if (cameraImage) {
          statusText.textContent =
            'ANALYZING CAMERA';


          activityStatus.textContent =
            'VISION';


          currentTask.textContent =
            'CAMERA ANALYSIS';
        }
      }
    }


    const payload = {
      message
    };


    if (
      cameraImage
    ) {
      payload.image =
        cameraImage;
    }


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
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data?.details ||
        data?.error ||
        'NOVA request failed'
      );
    }


    const answer =
      data
        ?.response
        ?.content ||
      'NOVA returned no response.';


    addNovaMessage(
      answer
    );


    if (
      data?.visionUsed
    ) {
      addSystemMessage(
        'Camera snapshot analyzed.'
      );
    }


    aiStatus.textContent =
      'READY';


    currentTask.textContent =
      'STANDBY';


    if (
      settings.voiceReplies
    ) {
      speakText(
        answer
      );

    } else {
      setCoreState(
        'idle'
      );


      activityStatus.textContent =
        'IDLE';


      statusText.textContent =
        'SYSTEMS ONLINE';
    }


  } catch (
    error
  ) {
    console.error(
      error
    );


    addSystemMessage(
      `NOVA error: ${
        error?.message ||
        'Unable to communicate with NOVA.'
      }`
    );


    backendStatus.textContent =
      'OFFLINE';


    aiStatus.textContent =
      'ERROR';


    setCoreState(
      'error'
    );


    statusText.textContent =
      'SYSTEM ERROR';


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
  const codes = {
    0: 'Clear',
    1: 'Mostly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',

    45: 'Fog',
    48: 'Fog',

    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',

    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',

    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',

    80: 'Rain Showers',
    81: 'Rain Showers',
    82: 'Heavy Showers',

    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  };


  return (
    codes[code] ||
    'Unknown'
  );
}


function updateWeather(
  weather
) {
  if (
    weather?.success !==
    true
  ) {
    weatherTemperature.textContent =
      '--°C';


    weatherCondition.textContent =
      'Unavailable';


    weatherLocation.textContent =
      'Location unavailable';


    return;
  }


  weatherTemperature.textContent =
    `${weather.temperature_c ?? '--'}°C`;


  weatherCondition.textContent =
    weatherCodeToText(
      weather.weather_code
    );


  weatherLocation.textContent =
    [
      weather.city,
      weather.region,
      weather.country
    ]
      .filter(Boolean)
      .join(', ');


  weatherHumidity.textContent =
    `${weather.humidity_percent ?? '--'}%`;


  weatherWind.textContent =
    `${weather.wind_speed_kmh ?? '--'} km/h`;
}


/* =========================================
   BLUETOOTH DISPLAY
========================================= */

function usefulBluetoothDevice(
  bluetooth
) {
  const devices =
    bluetooth
      ?.active_devices ||
    [];


  const ignored =
    [
      'intel',
      'service',
      'generic',
      'profile',
      'transport',
      'rfcomm',
      'personal area',
      'phonebook',
      'object push'
    ];


  return devices.find(
    device => {
      const name =
        String(
          device?.name ||
          ''
        )
          .trim();


      const lower =
        name.toLowerCase();


      return (
        name &&
        !ignored.some(
          value =>
            lower.includes(
              value
            )
        )
      );
    }
  );
}


/* =========================================
   NEWS
========================================= */

let lastHeadline =
  null;


function updateNews(
  news
) {
  newsList.innerHTML =
    '';


  if (
    news?.success !== true ||
    !Array.isArray(
      news.headlines
    )
  ) {
    newsStatus.textContent =
      'OFFLINE';


    const unavailable =
      document.createElement(
        'div'
      );


    unavailable.className =
      'news-item';


    unavailable.textContent =
      'News unavailable.';


    newsList.appendChild(
      unavailable
    );


    return;
  }


  newsStatus.textContent =
    'LIVE';


  const newest =
    news.headlines[0];


  if (
    newest &&
    lastHeadline &&
    newest.title !==
      lastHeadline &&
    settings.newsNotifications
  ) {
    addNotification(
      'NOVA News',
      newest.title
    );
  }


  if (newest) {
    lastHeadline =
      newest.title;
  }


  news.headlines.forEach(
    headline => {
      const card =
        document.createElement(
          'button'
        );


      card.type =
        'button';


      card.className =
        'news-item clickable-news';


      const title =
        document.createElement(
          'div'
        );


      title.className =
        'news-title';


      title.textContent =
        headline.title;


      const meta =
        document.createElement(
          'div'
        );


      meta.className =
        'news-meta';


      meta.textContent =
        headline.source ||
        'News';


      card.append(
        title,
        meta
      );


      card.addEventListener(
        'click',
        () => {
          if (
            headline.link
          ) {
            window.novaAPI
              ?.openExternal(
                headline.link
              );
          }
        }
      );


      newsList.appendChild(
        card
      );
    }
  );
}


/* =========================================
   LIVE DASHBOARD
========================================= */

let lowBatteryNotified =
  false;


async function refreshDashboard() {
  try {
    const response =
      await fetch(
        'http://127.0.0.1:3000/dashboard'
      );


    if (!response.ok) {
      throw new Error(
        'Dashboard failed'
      );
    }


    const data =
      await response.json();


    backendStatus.textContent =
      'ONLINE';


    backendStatus.classList.add(
      'online'
    );


    const system =
      data.system;


    if (
      system?.success
    ) {
      cpuUsage.textContent =
        `${system.cpu_usage_percent ?? '--'}%`;


      ramUsage.textContent =
        `${system.memory_usage_percent ?? '--'}%`;


      if (
        system.gpu
      ) {
        cpuUsage.title =
          `GPU: ${
            typeof system.gpu ===
              'string'
              ? system.gpu
              : JSON.stringify(
                  system.gpu
                )
          }`;
      }
    }


    const battery =
      data.battery;


    if (
      battery?.battery_present
    ) {
      batteryLevel.textContent =
        `${battery.percentage ?? '--'}%`;


      const percent =
        Number(
          battery.percentage
        );


      if (
        settings
          .batteryNotifications &&
        Number.isFinite(
          percent
        ) &&
        percent <= 20 &&
        !lowBatteryNotified
      ) {
        lowBatteryNotified =
          true;


        addNotification(
          'Low Battery',
          `Battery is at ${percent}%.`
        );
      }


      if (
        percent > 25
      ) {
        lowBatteryNotified =
          false;
      }

    } else {
      batteryLevel.textContent =
        '--%';
    }


    const wifi =
      data
        ?.wifi
        ?.current_connection;


    wifiName.textContent =
      wifi?.ssid ||
      'Not connected';


    wifiSignal.textContent =
      wifi?.signal ||
      '--';


    const bluetooth =
      data.bluetooth;


    const btDevice =
      usefulBluetoothDevice(
        bluetooth
      );


    bluetoothStatus.textContent =
      bluetooth
        ?.bluetooth_available
        ? 'AVAILABLE'
        : 'OFF';


    bluetoothDevice.textContent =
      btDevice
        ?.name
        ?.trim() ||

      (
        bluetooth
          ?.bluetooth_available
          ? 'Bluetooth enabled'
          : 'Unavailable'
      );


    updateWeather(
      data.weather
    );


    updateNews(
      data.news
    );


  } catch (
    error
  ) {
    console.error(
      error
    );


    backendStatus.textContent =
      'OFFLINE';


    backendStatus.classList.remove(
      'online'
    );


    newsStatus.textContent =
      'OFFLINE';
  }
}


refreshDashboard();


setInterval(
  refreshDashboard,
  5000
);


/* =========================================
   MEDIA AUTO DISCOVERY
========================================= */

let mediaItems =
  [];

let mediaIndex =
  0;

let mediaTimer =
  null;


async function loadMedia() {
  try {
    mediaItems =
      (
        await window
          .novaAPI
          ?.listMedia()
      ) || [];


    if (
      mediaIndex >=
      mediaItems.length
    ) {
      mediaIndex =
        0;
    }


    showCurrentMedia();


    restartMediaTimer();

  } catch (
    error
  ) {
    console.error(
      'Media loading failed:',
      error
    );
  }
}


function showCurrentMedia() {
  if (
    mediaItems.length ===
    0
  ) {
    posterImage.style.display =
      'none';


    posterPlaceholder.hidden =
      false;


    posterCaption.textContent =
      'Add images to desktop/media/';


    return;
  }


  const item =
    mediaItems[
      mediaIndex
    ];


  posterImage.onload =
    () => {
      posterImage.style.display =
        'block';


      posterPlaceholder.hidden =
        true;


      posterCaption.textContent =
        item.name;
    };


  posterImage.onerror =
    () => {
      nextMedia();
    };


  posterImage.src =
    item.url;
}


function nextMedia() {
  if (
    mediaItems.length ===
    0
  ) {
    return;
  }


  mediaIndex =
    (
      mediaIndex + 1
    ) %
    mediaItems.length;


  showCurrentMedia();
}


function restartMediaTimer() {
  if (
    mediaTimer
  ) {
    clearInterval(
      mediaTimer
    );


    mediaTimer =
      null;
  }


  if (
    !settings.mediaRotation ||
    mediaItems.length < 2
  ) {
    return;
  }


  mediaTimer =
    setInterval(
      nextMedia,
      Number(
        settings.mediaRotationSpeed
      )
    );
}


loadMedia();


setInterval(
  loadMedia,
  30000
);


/* =========================================
   ANIMATIONS
========================================= */

function applyAnimationSetting() {
  document.body.classList.toggle(
    'reduced-effects',
    !settings.enhancedAnimations
  );
}


/* =========================================
   SETTINGS EVENTS
========================================= */

cameraEnabledSetting
  .addEventListener(
    'change',
    async () => {
      settings.cameraEnabled =
        cameraEnabledSetting.checked;


      saveSettings();


      await startCamera();
    }
  );


cameraSidebarSetting
  .addEventListener(
    'change',
    () => {
      settings.cameraSidebar =
        cameraSidebarSetting.checked;


      saveSettings();


      updateCameraCardVisibility();
    }
  );


cameraMirrorSetting
  .addEventListener(
    'change',
    () => {
      settings.cameraMirror =
        cameraMirrorSetting.checked;


      saveSettings();


      applyCameraMirror();
    }
  );


cameraDeviceSelect
  .addEventListener(
    'change',
    async () => {
      settings.cameraDevice =
        cameraDeviceSelect.value;


      saveSettings();


      if (
        settings.cameraEnabled
      ) {
        await startCamera();
      }
    }
  );


mediaRotationSetting
  .addEventListener(
    'change',
    () => {
      settings.mediaRotation =
        mediaRotationSetting.checked;


      saveSettings();


      restartMediaTimer();
    }
  );


mediaRotationSpeedSetting
  .addEventListener(
    'change',
    () => {
      settings.mediaRotationSpeed =
        Number(
          mediaRotationSpeedSetting
            .value
        );


      saveSettings();


      restartMediaTimer();
    }
  );


desktopNotificationsSetting
  .addEventListener(
    'change',
    () => {
      settings.desktopNotifications =
        desktopNotificationsSetting
          .checked;


      saveSettings();
    }
  );


batteryNotificationsSetting
  .addEventListener(
    'change',
    () => {
      settings.batteryNotifications =
        batteryNotificationsSetting
          .checked;


      saveSettings();
    }
  );


newsNotificationsSetting
  .addEventListener(
    'change',
    () => {
      settings.newsNotifications =
        newsNotificationsSetting
          .checked;


      saveSettings();
    }
  );


voiceRepliesSetting
  .addEventListener(
    'change',
    () => {
      settings.voiceReplies =
        voiceRepliesSetting.checked;


      saveSettings();


      updateVoiceStatus();


      if (
        !settings.voiceReplies
      ) {
        speechSynthesis.cancel();
      }
    }
  );


enhancedAnimationsSetting
  .addEventListener(
    'change',
    () => {
      settings.enhancedAnimations =
        enhancedAnimationsSetting
          .checked;


      saveSettings();


      applyAnimationSetting();
    }
  );


startupSetting
  .addEventListener(
    'change',
    async () => {
      settings.startup =
        startupSetting.checked;


      saveSettings();


      const actual =
        await window
          .novaAPI
          ?.setStartup(
            settings.startup
          );


      settings.startup =
        Boolean(
          actual
        );


      startupSetting.checked =
        settings.startup;


      saveSettings();
    }
  );


traySetting
  .addEventListener(
    'change',
    async () => {
      settings.tray =
        traySetting.checked;


      saveSettings();


      await window
        .novaAPI
        ?.setTray(
          settings.tray
        );
    }
  );


/* =========================================
   CHAT EVENTS
========================================= */

sendButton
  ?.addEventListener(
    'click',
    sendMessage
  );


messageInput
  ?.addEventListener(
    'keydown',
    event => {
      if (
        event.key ===
        'Enter'
      ) {
        event.preventDefault();


        sendMessage();
      }
    }
  );


/* =========================================
   INIT
========================================= */

async function initializeNovaUI() {
  loadSettingsIntoUI();


  try {
    const actualStartup =
      await window
        .novaAPI
        ?.getStartup();


    settings.startup =
      Boolean(
        actualStartup
      );


    startupSetting.checked =
      settings.startup;

  } catch {}


  try {
    await window
      .novaAPI
      ?.setTray(
        settings.tray
      );

  } catch {}


  updateCameraCardVisibility();


  applyCameraMirror();


  await populateCameraDevices();


  if (
    settings.cameraEnabled
  ) {
    await startCamera();
  }


  speechSynthesis
    ?.getVoices();


  messageInput
    ?.focus();
}


initializeNovaUI();