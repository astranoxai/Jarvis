const $ = id =>
  document.getElementById(id);


const NOVA_API =
  'http://127.0.0.1:3000';

const VOICE_API =
  'http://127.0.0.1:5001';


/* ============================================================
   UI
============================================================ */

const messageInput =
  $('messageInput');

const sendButton =
  $('sendButton');

const visionButton =
  $('visionButton');

const liveVisionButton =
  $('liveVisionButton');

const liveVoiceButton =
  $('liveVoiceButton');

const responseBox =
  $('responseBox');

const commandFeed =
  $('commandFeed');

const novaCore =
  $('novaCore');

const statusText =
  $('statusText');

const activityStatus =
  $('activityStatus');

const currentTask =
  $('currentTask');

const voiceStatus =
  $('voiceStatus');

const backendStatus =
  $('backendStatus');

const aiStatus =
  $('aiStatus');

const cameraHeaderStatus =
  $('cameraHeaderStatus');

const visionHeaderStatus =
  $('visionHeaderStatus');

const micHeaderStatus =
  $('micHeaderStatus');

const liveVoiceBadge =
  $('liveVoiceBadge');

const liveVoiceState =
  $('liveVoiceState');

const liveVisionState =
  $('liveVisionState');

const voiceMeter =
  $('voiceMeter');


/* ============================================================
   CLOCK
============================================================ */

const systemClock =
  $('systemClock');

const systemDate =
  $('systemDate');


/* ============================================================
   DASHBOARD
============================================================ */

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


/* ============================================================
   CAMERA
============================================================ */

const cameraCard =
  $('cameraCard');

const cameraPreview =
  $('cameraPreview');

const cameraPlaceholder =
  $('cameraPlaceholder');

const cameraDeviceName =
  $('cameraDeviceName');

const cameraLiveBadge =
  $('cameraLiveBadge');


/* ============================================================
   MEDIA
============================================================ */

const posterImage =
  $('posterImage');

const posterPlaceholder =
  $('posterPlaceholder');

const posterCaption =
  $('posterCaption');


/* ============================================================
   SETTINGS
============================================================ */

const settingsButton =
  $('settingsButton');

const settingsOverlay =
  $('settingsOverlay');

const closeSettingsButton =
  $('closeSettingsButton');

const settingsSaveStatus =
  $('settingsSaveStatus');

const cameraEnabledSetting =
  $('cameraEnabledSetting');

const cameraSidebarSetting =
  $('cameraSidebarSetting');

const cameraMirrorSetting =
  $('cameraMirrorSetting');

const cameraDeviceSelect =
  $('cameraDeviceSelect');

const voiceRepliesSetting =
  $('voiceRepliesSetting');

const enhancedAnimationsSetting =
  $('enhancedAnimationsSetting');

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


/* ============================================================
   ALERTS
============================================================ */

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


/* ============================================================
   SETTINGS DATA
============================================================ */

const defaultSettings = {
  cameraEnabled:
    false,

  cameraSidebar:
    false,

  cameraMirror:
    true,

  cameraDevice:
    '',

  voiceReplies:
    true,

  enhancedAnimations:
    true,

  mediaRotation:
    true,

  mediaRotationSpeed:
    8000,

  desktopNotifications:
    true,

  batteryNotifications:
    true,

  newsNotifications:
    false,

  startup:
    false,

  tray:
    true
};


let settings =
  loadSettings();


function loadSettings() {
  try {
    return {
      ...defaultSettings,

      ...JSON.parse(
        localStorage.getItem(
          'nova-settings'
        ) ||
        '{}'
      )
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
    JSON.stringify(
      settings
    )
  );

  if (
    settingsSaveStatus
  ) {
    settingsSaveStatus.textContent =
      'Settings saved.';

    setTimeout(
      () => {
        settingsSaveStatus.textContent =
          'Settings save automatically.';
      },
      1000
    );
  }
}


/* ============================================================
   CORE STATE
============================================================ */

function setCoreState(
  state
) {
  if (
    !novaCore
  ) {
    return;
  }

  novaCore.classList.remove(
    'thinking',
    'speaking',
    'listening',
    'error'
  );

  if (
    state &&
    state !==
      'idle'
  ) {
    novaCore.classList.add(
      state
    );
  }
}


function readyState() {
  if (
    liveVoiceEnabled
  ) {
    setVoiceState(
      'listening',
      'Listening...'
    );

    return;
  }

  setCoreState(
    'idle'
  );

  if (
    activityStatus
  ) {
    activityStatus.textContent =
      'IDLE';
  }

  if (
    currentTask
  ) {
    currentTask.textContent =
      'STANDBY';
  }

  if (
    statusText
  ) {
    statusText.textContent =
      'SYSTEMS ONLINE';
  }

  if (
    aiStatus
  ) {
    aiStatus.textContent =
      'READY';

    aiStatus.classList.add(
      'online-text'
    );
  }
}


/* ============================================================
   FEED
============================================================ */

function createFeedCard(
  type,
  heading,
  text
) {
  const card =
    document.createElement(
      'article'
    );

  card.className =
    `feed-card ${type}`;


  const title =
    document.createElement(
      'span'
    );

  title.textContent =
    heading;


  const body =
    document.createElement(
      'p'
    );

  body.textContent =
    text;


  card.append(
    title,
    body
  );

  return card;
}


function scrollFeed() {
  commandFeed?.scrollTo({
    top:
      commandFeed.scrollHeight,

    behavior:
      'smooth'
  });
}


function addUserMessage(
  text
) {
  commandFeed?.appendChild(
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
  if (
    responseBox
  ) {
    responseBox.textContent =
      text;
  }

  commandFeed?.appendChild(
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
  commandFeed?.appendChild(
    createFeedCard(
      'system-message',
      'SYSTEM',
      text
    )
  );

  scrollFeed();
}


/* ============================================================
   CLOCK
============================================================ */

function updateClock() {
  const now =
    new Date();

  if (
    systemClock
  ) {
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
  }

  if (
    systemDate
  ) {
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
}


updateClock();

setInterval(
  updateClock,
  1000
);


/* ============================================================
   SETTINGS PANEL
============================================================ */

settingsButton
  ?.addEventListener(
    'click',
    () => {
      settingsOverlay.hidden =
        false;
    }
  );


closeSettingsButton
  ?.addEventListener(
    'click',
    () => {
      settingsOverlay.hidden =
        true;
    }
  );


settingsOverlay
  ?.addEventListener(
    'click',
    event => {
      if (
        event.target ===
        settingsOverlay
      ) {
        settingsOverlay.hidden =
          true;
      }
    }
  );


/* ============================================================
   NOTIFICATIONS
============================================================ */

let notifications =
  [];

let unreadNotifications =
  0;


function renderNotifications() {
  if (
    !notificationList
  ) {
    return;
  }

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

    empty.textContent =
      'No alerts.';

    notificationList.appendChild(
      empty
    );

  } else {

    for (
      const item
      of notifications
    ) {
      const element =
        document.createElement(
          'div'
        );

      element.className =
        'notification-entry';

      element.textContent =
        `${item.title}: ${item.body}`;

      notificationList.appendChild(
        element
      );
    }
  }

  if (
    notificationBadge
  ) {
    notificationBadge.hidden =
      unreadNotifications ===
      0;

    notificationBadge.textContent =
      String(
        unreadNotifications
      );
  }
}


function addNotification(
  title,
  body,
  desktop = true
) {
  notifications.unshift({
    title,
    body
  });

  notifications =
    notifications.slice(
      0,
      30
    );

  unreadNotifications++;

  renderNotifications();

  if (
    desktop &&
    settings.desktopNotifications
  ) {
    window.novaAPI
      ?.showNotification?.({
        title,
        body
      });
  }
}


notificationsButton
  ?.addEventListener(
    'click',
    () => {
      notificationPanel.hidden =
        false;

      unreadNotifications =
        0;

      renderNotifications();
    }
  );


closeNotificationsButton
  ?.addEventListener(
    'click',
    () => {
      notificationPanel.hidden =
        true;
    }
  );


renderNotifications();


/* ============================================================
   WINDOWS TTS
============================================================ */

let novaSpeaking =
  false;


function getBestVoice() {
  if (
    typeof speechSynthesis ===
      'undefined'
  ) {
    return null;
  }

  const voices =
    speechSynthesis
      .getVoices();

  return (
    voices.find(
      voice =>
        /Microsoft (Ryan|Mark|David|Guy|Aria|Zira)/i
          .test(
            voice.name
          )
    ) ||

    voices.find(
      voice =>
        /^en/i.test(
          voice.lang
        )
    ) ||

    voices[0] ||

    null
  );
}


function speakWindows(
  text
) {
  return new Promise(
    resolve => {
      if (
        typeof speechSynthesis ===
          'undefined'
      ) {
        resolve();

        return;
      }

      speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      const voice =
        getBestVoice();

      if (
        voice
      ) {
        utterance.voice =
          voice;
      }

      utterance.rate =
        1.04;

      utterance.pitch =
        0.88;

      utterance.volume =
        1;


      utterance.onstart =
        () => {
          novaSpeaking =
            true;

          setVoiceState(
            'speaking',
            'NOVA speaking...'
          );
        };


      const finish =
        () => {
          novaSpeaking =
            false;

          resolve();
        };


      utterance.onend =
        finish;

      utterance.onerror =
        finish;


      speechSynthesis.speak(
        utterance
      );
    }
  );
}


/* ============================================================
   CAMERA
============================================================ */

let cameraStream =
  null;

let visionArmed =
  false;

let liveVisionEnabled =
  false;


/* ============================================================
   CAMERA UI
============================================================ */

function updateVisionUI() {
  if (
    visionButton
  ) {
    visionButton.classList.toggle(
      'active',
      visionArmed
    );

    visionButton.textContent =
      visionArmed
        ? 'VISION READY'
        : 'VISION';
  }


  if (
    liveVisionButton
  ) {
    liveVisionButton.classList.toggle(
      'active',
      liveVisionEnabled
    );

    liveVisionButton.textContent =
      liveVisionEnabled
        ? 'STOP VISION'
        : 'LIVE VISION';
  }


  if (
    liveVisionEnabled
  ) {
    visionHeaderStatus.textContent =
      'WATCHING';

    visionHeaderStatus.classList.add(
      'online-text'
    );

    if (
      liveVisionState
    ) {
      liveVisionState.textContent =
        'LIVE VISION WATCHING';

      liveVisionState.classList.add(
        'active'
      );
    }

  } else if (
    visionArmed
  ) {
    visionHeaderStatus.textContent =
      'ARMED';

    visionHeaderStatus.classList.add(
      'online-text'
    );

    if (
      liveVisionState
    ) {
      liveVisionState.textContent =
        'MANUAL VISION READY';

      liveVisionState.classList.remove(
        'active'
      );
    }

  } else {
    visionHeaderStatus.textContent =
      'OFF';

    visionHeaderStatus.classList.remove(
      'online-text'
    );

    if (
      liveVisionState
    ) {
      liveVisionState.textContent =
        'LIVE VISION OFF';

      liveVisionState.classList.remove(
        'active'
      );
    }
  }
}


function applyCameraVisibility() {
  if (
    !cameraCard
  ) {
    return;
  }

  cameraCard.hidden =
    !(
      settings.cameraEnabled &&
      settings.cameraSidebar
    );
}


function applyCameraMirror() {
  if (
    !cameraPreview
  ) {
    return;
  }

  cameraPreview.style.transform =
    settings.cameraMirror
      ? 'scaleX(-1)'
      : 'scaleX(1)';
}


/* ============================================================
   CAMERA START / STOP
============================================================ */

async function stopCamera() {
  liveVisionEnabled =
    false;

  updateVisionUI();

  if (
    cameraStream
  ) {
    cameraStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    cameraStream =
      null;
  }

  if (
    cameraPreview
  ) {
    cameraPreview.srcObject =
      null;
  }

  if (
    cameraHeaderStatus
  ) {
    cameraHeaderStatus.textContent =
      'OFF';

    cameraHeaderStatus.classList.remove(
      'online-text'
    );
  }

  if (
    cameraLiveBadge
  ) {
    cameraLiveBadge.textContent =
      'OFF';
  }

  if (
    cameraPlaceholder
  ) {
    cameraPlaceholder.hidden =
      false;

    cameraPlaceholder.textContent =
      'CAMERA OFF';
  }

  if (
    cameraDeviceName
  ) {
    cameraDeviceName.textContent =
      'No camera selected';
  }

  visionArmed =
    false;

  updateVisionUI();
}


async function populateCameraDevices() {
  if (
    !navigator.mediaDevices ||
    !cameraDeviceSelect
  ) {
    return;
  }

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
      'Camera enumeration failed:',
      error
    );
  }
}


async function startCamera() {
  if (
    !settings.cameraEnabled
  ) {
    return false;
  }

  try {
    if (
      cameraStream
    ) {
      cameraStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );
    }

    const video =
      settings.cameraDevice

        ? {
            deviceId: {
              exact:
                settings.cameraDevice
            },

            width: {
              ideal:
                1920
            },

            height: {
              ideal:
                1080
            },

            frameRate: {
              ideal:
                30
            }
          }

        : {
            width: {
              ideal:
                1920
            },

            height: {
              ideal:
                1080
            },

            frameRate: {
              ideal:
                30
            }
          };


    cameraStream =
      await navigator
        .mediaDevices
        .getUserMedia({
          video,
          audio:
            false
        });


    cameraPreview.srcObject =
      cameraStream;

    await cameraPreview.play();


    applyCameraMirror();


    cameraHeaderStatus.textContent =
      'ACTIVE';

    cameraHeaderStatus.classList.add(
      'online-text'
    );


    cameraLiveBadge.textContent =
      'ACTIVE';


    cameraPlaceholder.hidden =
      true;


    const track =
      cameraStream
        .getVideoTracks()[0];


    cameraDeviceName.textContent =
      track?.label ||
      'Camera active';


    applyCameraVisibility();

    await populateCameraDevices();


    return true;

  } catch (
    error
  ) {
    console.error(
      'Camera failed:',
      error
    );

    cameraHeaderStatus.textContent =
      'ERROR';

    cameraHeaderStatus.classList.remove(
      'online-text'
    );

    addSystemMessage(
      `Camera error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );

    return false;
  }
}


function cameraReady() {
  return Boolean(
    cameraStream &&
    cameraPreview &&
    cameraPreview.readyState >=
      2 &&
    cameraPreview.videoWidth >
      0 &&
    cameraPreview.videoHeight >
      0
  );
}


/* ============================================================
   WAIT FOR CAMERA FRAME
============================================================ */

function sleep(
  ms
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


async function waitForCameraReady(
  timeout = 5000
) {
  const start =
    Date.now();

  while (
    Date.now() -
      start <
      timeout
  ) {
    if (
      cameraReady()
    ) {
      return true;
    }

    await sleep(
      100
    );
  }

  return false;
}


/* ============================================================
   FRAME CAPTURE
============================================================ */

function captureFrameData(
  maxWidth = 1280,
  quality = 0.92
) {
  if (
    !cameraReady()
  ) {
    return null;
  }

  const sourceWidth =
    cameraPreview.videoWidth;

  const sourceHeight =
    cameraPreview.videoHeight;


  const scale =
    Math.min(
      1,
      maxWidth /
        sourceWidth
    );


  const width =
    Math.max(
      1,
      Math.round(
        sourceWidth *
        scale
      )
    );


  const height =
    Math.max(
      1,
      Math.round(
        sourceHeight *
        scale
      )
    );


  const canvas =
    document.createElement(
      'canvas'
    );

  canvas.width =
    width;

  canvas.height =
    height;


  const context =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true
      }
    );


  if (
    !context
  ) {
    return null;
  }


  /*
    Important:
    We capture the actual camera frame,
    not the CSS-mirrored preview.
  */

  context.drawImage(
    cameraPreview,
    0,
    0,
    width,
    height
  );


  const image =
    canvas.toDataURL(
      'image/jpeg',
      quality
    );


  /*
    Simple sharpness measurement.
  */

  const smallCanvas =
    document.createElement(
      'canvas'
    );

  smallCanvas.width =
    160;

  smallCanvas.height =
    Math.max(
      90,
      Math.round(
        160 *
        height /
        width
      )
    );


  const smallContext =
    smallCanvas.getContext(
      '2d',
      {
        willReadFrequently:
          true
      }
    );


  let sharpness =
    0;


  if (
    smallContext
  ) {
    smallContext.drawImage(
      canvas,
      0,
      0,
      smallCanvas.width,
      smallCanvas.height
    );


    const pixels =
      smallContext.getImageData(
        0,
        0,
        smallCanvas.width,
        smallCanvas.height
      ).data;


    let total =
      0;

    let count =
      0;


    for (
      let y = 1;
      y <
        smallCanvas.height -
          1;
      y += 2
    ) {

      for (
        let x = 1;
        x <
          smallCanvas.width -
            1;
        x += 2
      ) {

        const i =
          (
            y *
              smallCanvas.width +
            x
          ) * 4;


        const right =
          i + 4;


        const below =
          i +
          smallCanvas.width *
            4;


        const gray =
          pixels[i] *
            0.299 +
          pixels[i + 1] *
            0.587 +
          pixels[i + 2] *
            0.114;


        const grayRight =
          pixels[right] *
            0.299 +
          pixels[right + 1] *
            0.587 +
          pixels[right + 2] *
            0.114;


        const grayBelow =
          pixels[below] *
            0.299 +
          pixels[below + 1] *
            0.587 +
          pixels[below + 2] *
            0.114;


        total +=
          Math.abs(
            gray -
            grayRight
          ) +

          Math.abs(
            gray -
            grayBelow
          );


        count++;
      }
    }


    sharpness =
      count
        ? total /
          count
        : 0;
  }


  return {
    image,
    sharpness,
    width,
    height
  };
}


/* ============================================================
   MULTI FRAME CAPTURE
============================================================ */

async function captureBestFreshFrame() {
  if (
    !cameraReady()
  ) {
    return null;
  }

  const frames =
    [];


  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const frame =
      captureFrameData(
        1280,
        0.92
      );


    if (
      frame
    ) {
      frames.push(
        frame
      );
    }


    if (
      i < 2
    ) {
      await sleep(
        120
      );
    }
  }


  if (
    !frames.length
  ) {
    return null;
  }


  frames.sort(
    (
      a,
      b
    ) =>
      b.sharpness -
      a.sharpness
  );


  console.log(
    'Vision frame scores:',
    frames.map(
      frame =>
        frame.sharpness
          .toFixed(
            2
          )
    )
  );


  return frames[0].image;
}


/* ============================================================
   LIVE VISION
============================================================ */

async function startLiveVision() {
  if (
    liveVisionEnabled
  ) {
    return;
  }


  /*
    Clicking LIVE VISION is the user's
    explicit instruction to activate
    camera vision.
  */

  if (
    !settings.cameraEnabled
  ) {
    settings.cameraEnabled =
      true;

    cameraEnabledSetting.checked =
      true;

    saveSettings();
  }


  if (
    !cameraReady()
  ) {
    const started =
      await startCamera();

    if (
      !started
    ) {
      return;
    }
  }


  const ready =
    await waitForCameraReady();


  if (
    !ready
  ) {
    addSystemMessage(
      'Live Vision could not get a camera frame.'
    );

    return;
  }


  liveVisionEnabled =
    true;

  /*
    Make camera preview visible while
    live vision is active.
  */

  settings.cameraSidebar =
    true;

  cameraSidebarSetting.checked =
    true;

  saveSettings();

  applyCameraVisibility();

  updateVisionUI();


  addSystemMessage(
    'Live Vision active. A fresh webcam snapshot will be included with every Live Voice turn.'
  );
}


function stopLiveVision() {
  liveVisionEnabled =
    false;

  updateVisionUI();

  addSystemMessage(
    'Live Vision stopped.'
  );
}


liveVisionButton
  ?.addEventListener(
    'click',
    async () => {
      if (
        liveVisionEnabled
      ) {
        stopLiveVision();

      } else {
        await startLiveVision();
      }
    }
  );


/* ============================================================
   MANUAL VISION
============================================================ */

visionButton
  ?.addEventListener(
    'click',
    async () => {
      if (
        !settings.cameraEnabled
      ) {
        settings.cameraEnabled =
          true;

        cameraEnabledSetting.checked =
          true;

        saveSettings();
      }


      if (
        !cameraReady()
      ) {
        const started =
          await startCamera();

        if (
          !started
        ) {
          return;
        }

        await waitForCameraReady();
      }


      if (
        !cameraReady()
      ) {
        addSystemMessage(
          'Camera is not ready.'
        );

        return;
      }


      visionArmed =
        !visionArmed;

      updateVisionUI();
    }
  );


/* ============================================================
   NOVA REQUEST
============================================================ */

async function askNova(
  message,
  options = {}
) {
  const payload = {
    message,

    voiceMode:
      Boolean(
        options.voiceMode
      )
  };


  if (
    options.image
  ) {
    payload.image =
      options.image;
  }


  console.log(
    'Sending NOVA request:',
    {
      voiceMode:
        payload.voiceMode,

      hasImage:
        Boolean(
          payload.image
        ),

      message
    }
  );


  const response =
    await fetch(
      `${NOVA_API}/chat`,
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


  let data;


  try {
    data =
      await response.json();

  } catch {
    throw new Error(
      `NOVA returned HTTP ${response.status} without JSON.`
    );
  }


  if (
    !response.ok
  ) {
    throw new Error(
      data?.details ||
      data?.error ||
      `NOVA HTTP ${response.status}`
    );
  }


  const answer =
    typeof data
      ?.response
      ?.content ===
      'string'

      ? data.response.content.trim()

      : '';


  if (
    !answer
  ) {
    throw new Error(
      'NOVA returned an empty answer.'
    );
  }


  console.log(
    'NOVA response:',
    {
      visionUsed:
        data?.visionUsed,

      voiceMode:
        data?.voiceMode
    }
  );


  return {
    answer,

    visionUsed:
      Boolean(
        data?.visionUsed
      )
  };
}


/* ============================================================
   TEXT CHAT
============================================================ */

async function sendMessage() {
  const message =
    messageInput
      ?.value
      ?.trim();


  if (
    !message
  ) {
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


  try {
    let image =
      null;


    if (
      visionArmed
    ) {
      statusText.textContent =
        'CAPTURING VISION';

      image =
        await captureBestFreshFrame();

      visionArmed =
        false;

      updateVisionUI();


      if (
        !image
      ) {
        throw new Error(
          'Camera snapshot failed.'
        );
      }
    }


    setCoreState(
      'thinking'
    );


    activityStatus.textContent =
      image
        ? 'VISION'
        : 'THINKING';


    currentTask.textContent =
      image
        ? 'VISUAL ANALYSIS'
        : message
            .toUpperCase()
            .slice(
              0,
              30
            );


    statusText.textContent =
      image
        ? 'ANALYZING VISION'
        : 'PROCESSING';


    const result =
      await askNova(
        message,
        {
          image,
          voiceMode:
            false
        }
      );


    addNovaMessage(
      result.answer
    );


    if (
      image
    ) {
      if (
        result.visionUsed
      ) {
        addSystemMessage(
          'Vision snapshot was received by NOVA.'
        );

      } else {
        addSystemMessage(
          'Warning: image was sent but backend did not report vision usage.'
        );
      }
    }


    if (
      settings.voiceReplies
    ) {
      await speakWindows(
        result.answer
      );
    }


    readyState();

  } catch (
    error
  ) {
    console.error(
      error
    );

    addSystemMessage(
      `Request failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );

    setCoreState(
      'error'
    );

    statusText.textContent =
      'REQUEST ERROR';

  } finally {
    messageInput.disabled =
      false;

    sendButton.disabled =
      false;

    messageInput.focus();
  }
}


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


/* ============================================================
   LIVE VOICE
============================================================ */

let liveVoiceEnabled =
  false;

let micStream =
  null;

let recorder =
  null;

let recorderChunks =
  [];

let audioContext =
  null;

let analyser =
  null;

let analyserSource =
  null;

let monitorAnimation =
  null;

let speechDetected =
  false;

let speechStartTime =
  0;

let lastSpeechTime =
  0;

let recorderStartTime =
  0;

let processingVoice =
  false;


const SPEECH_THRESHOLD =
  0.026;

const MIN_SPEECH_MS =
  280;

const END_SILENCE_MS =
  650;

const MAX_SPEECH_MS =
  20000;

const MAX_WAITING_MS =
  30000;


/* ============================================================
   LIVE VOICE UI
============================================================ */

function updateLiveVoiceUI() {
  if (
    liveVoiceButton
  ) {
    liveVoiceButton.classList.toggle(
      'active',
      liveVoiceEnabled
    );

    liveVoiceButton.textContent =
      liveVoiceEnabled
        ? 'STOP VOICE'
        : 'LIVE VOICE';
  }


  if (
    micHeaderStatus
  ) {
    micHeaderStatus.textContent =
      liveVoiceEnabled
        ? 'ACTIVE'
        : 'OFF';

    micHeaderStatus.classList.toggle(
      'online-text',
      liveVoiceEnabled
    );
  }


  if (
    liveVoiceBadge
  ) {
    liveVoiceBadge.textContent =
      liveVoiceEnabled
        ? 'LIVE'
        : 'OFF';
  }


  if (
    voiceStatus
  ) {
    voiceStatus.textContent =
      liveVoiceEnabled
        ? 'LIVE'
        : (
            settings.voiceReplies
              ? 'ENABLED'
              : 'OFF'
          );
  }
}


function setVoiceState(
  state,
  text
) {
  if (
    liveVoiceState
  ) {
    liveVoiceState.textContent =
      text;
  }


  if (
    state ===
    'listening'
  ) {
    setCoreState(
      'listening'
    );

    activityStatus.textContent =
      'LISTENING';

    currentTask.textContent =
      liveVisionEnabled
        ? 'VOICE + VISION'
        : 'LIVE VOICE';

    statusText.textContent =
      liveVisionEnabled
        ? 'LISTENING + WATCHING'
        : 'LISTENING';

  } else if (
    state ===
    'thinking'
  ) {
    setCoreState(
      'thinking'
    );

    activityStatus.textContent =
      'THINKING';

    statusText.textContent =
      'UNDERSTANDING';

  } else if (
    state ===
    'speaking'
  ) {
    setCoreState(
      'speaking'
    );

    activityStatus.textContent =
      'SPEAKING';

    statusText.textContent =
      'NOVA SPEAKING';
  }
}


/* ============================================================
   RECORDING
============================================================ */

function chooseRecorderMime() {
  const choices = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus'
  ];


  for (
    const type
    of choices
  ) {
    if (
      MediaRecorder
        .isTypeSupported(
          type
        )
    ) {
      return type;
    }
  }


  return '';
}


function blobToDataURL(
  blob
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();


      reader.onload =
        () =>
          resolve(
            reader.result
          );


      reader.onerror =
        reject;


      reader.readAsDataURL(
        blob
      );
    }
  );
}


function recorderSuffix(
  mime
) {
  if (
    mime.includes(
      'ogg'
    )
  ) {
    return '.ogg';
  }


  return '.webm';
}


function beginVoiceTurn() {
  if (
    !liveVoiceEnabled ||
    processingVoice ||
    !micStream
  ) {
    return;
  }


  if (
    recorder &&
    recorder.state !==
      'inactive'
  ) {
    return;
  }


  recorderChunks =
    [];

  speechDetected =
    false;

  speechStartTime =
    0;

  lastSpeechTime =
    performance.now();

  recorderStartTime =
    performance.now();


  const mime =
    chooseRecorderMime();


  recorder =
    mime

      ? new MediaRecorder(
          micStream,
          {
            mimeType:
              mime
          }
        )

      : new MediaRecorder(
          micStream
        );


  recorder.ondataavailable =
    event => {
      if (
        event.data &&
        event.data.size >
          0
      ) {
        recorderChunks.push(
          event.data
        );
      }
    };


  recorder.onstop =
    async () => {
      const detected =
        speechDetected;

      const chunks =
        recorderChunks;

      const mimeType =
        recorder?.mimeType ||
        'audio/webm';


      recorder =
        null;

      recorderChunks =
        [];


      if (
        !liveVoiceEnabled
      ) {
        return;
      }


      if (
        !detected ||
        chunks.length ===
          0
      ) {
        setTimeout(
          beginVoiceTurn,
          80
        );

        return;
      }


      const blob =
        new Blob(
          chunks,
          {
            type:
              mimeType
          }
        );


      await processVoiceTurn(
        blob,
        recorderSuffix(
          mimeType
        )
      );
    };


  recorder.start(
    150
  );


  setVoiceState(
    'listening',
    'Listening...'
  );
}


/* ============================================================
   MIC VAD
============================================================ */

function monitorMicrophone() {
  if (
    !liveVoiceEnabled ||
    !analyser
  ) {
    return;
  }


  const samples =
    new Uint8Array(
      analyser.fftSize
    );


  analyser.getByteTimeDomainData(
    samples
  );


  let sum =
    0;


  for (
    const sample
    of samples
  ) {
    const value =
      (
        sample -
        128
      ) /
      128;

    sum +=
      value *
      value;
  }


  const rms =
    Math.sqrt(
      sum /
      samples.length
    );


  if (
    voiceMeter
  ) {
    voiceMeter.style.width =
      `${Math.min(
        100,
        rms *
          1200
      )}%`;
  }


  const now =
    performance.now();


  if (
    !processingVoice &&
    !novaSpeaking &&
    recorder?.state ===
      'recording'
  ) {

    if (
      rms >
      SPEECH_THRESHOLD
    ) {

      if (
        !speechDetected
      ) {
        speechDetected =
          true;

        speechStartTime =
          now;

        liveVoiceState.textContent =
          'Hearing you...';
      }


      lastSpeechTime =
        now;
    }


    if (
      speechDetected
    ) {
      const spokenFor =
        now -
        speechStartTime;


      const silentFor =
        now -
        lastSpeechTime;


      if (
        spokenFor >=
          MIN_SPEECH_MS &&
        silentFor >=
          END_SILENCE_MS &&
        recorder.state ===
          'recording'
      ) {
        recorder.stop();

      } else if (
        spokenFor >=
          MAX_SPEECH_MS &&
        recorder.state ===
          'recording'
      ) {
        recorder.stop();
      }

    } else if (
      now -
        recorderStartTime >=
        MAX_WAITING_MS &&
      recorder.state ===
        'recording'
    ) {
      recorder.stop();
    }
  }


  monitorAnimation =
    requestAnimationFrame(
      monitorMicrophone
    );
}


/* ============================================================
   LOCAL WHISPER
============================================================ */

async function transcribeLocally(
  blob,
  suffix
) {
  const audio =
    await blobToDataURL(
      blob
    );


  const response =
    await fetch(
      `${VOICE_API}/transcribe`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify({
            audio,
            suffix
          })
      }
    );


  let data;


  try {
    data =
      await response.json();

  } catch {
    throw new Error(
      `Local Whisper HTTP ${response.status}`
    );
  }


  if (
    !response.ok ||
    data?.success !==
      true
  ) {
    throw new Error(
      data?.error ||
      'Local Whisper failed.'
    );
  }


  return String(
    data?.text ||
    ''
  ).trim();
}


/* ============================================================
   PROCESS VOICE TURN
============================================================ */

async function processVoiceTurn(
  blob,
  suffix
) {
  processingVoice =
    true;


  try {
    setVoiceState(
      'thinking',
      'Understanding...'
    );


    const transcript =
      await transcribeLocally(
        blob,
        suffix
      );


    if (
      !transcript
    ) {
      return;
    }


    console.log(
      'Whisper transcript:',
      transcript
    );


    let image =
      null;


    /*
      THIS IS THE IMPORTANT CHANGE.

      When Live Vision is ON,
      every spoken turn receives
      a fresh camera frame.

      There is no phrase matching.
    */

    if (
      liveVisionEnabled
    ) {

      if (
        !cameraReady()
      ) {
        console.warn(
          'Live Vision enabled but camera was not ready.'
        );

        const restarted =
          await startCamera();


        if (
          restarted
        ) {
          await waitForCameraReady();
        }
      }


      if (
        cameraReady()
      ) {
        setVoiceState(
          'thinking',
          'Capturing vision...'
        );


        statusText.textContent =
          'CAPTURING LIVE VISION';


        image =
          await captureBestFreshFrame();


        if (
          image
        ) {
          console.log(
            'LIVE VISION: image attached to voice turn.'
          );

          statusText.textContent =
            'ANALYZING LIVE VISION';

          currentTask.textContent =
            'VOICE + VISION';

        } else {
          console.warn(
            'LIVE VISION: frame capture failed.'
          );
        }
      }
    }


    aiStatus.textContent =
      'THINKING';

    aiStatus.classList.remove(
      'online-text'
    );


    const result =
      await askNova(
        transcript,
        {
          voiceMode:
            true,

          image
        }
      );


    addNovaMessage(
      result.answer
    );


    /*
      Useful verification.
    */

    if (
      liveVisionEnabled
    ) {

      if (
        image &&
        result.visionUsed
      ) {
        console.log(
          'LIVE VISION VERIFIED: backend used image.'
        );

        if (
          liveVisionState
        ) {
          liveVisionState.textContent =
            'VISION FRAME ANALYZED';
        }

      } else if (
        image &&
        !result.visionUsed
      ) {
        addSystemMessage(
          'Live Vision warning: frame was sent but backend did not confirm vision.'
        );

      } else {
        addSystemMessage(
          'Live Vision warning: no camera frame was captured.'
        );
      }
    }


    aiStatus.textContent =
      'READY';

    aiStatus.classList.add(
      'online-text'
    );


    await speakWindows(
      result.answer
    );


  } catch (
    error
  ) {
    console.error(
      'Live Voice/Vision error:',
      error
    );


    addSystemMessage(
      `Live Voice error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );


    setCoreState(
      'error'
    );


    if (
      liveVoiceState
    ) {
      liveVoiceState.textContent =
        'Voice error';
    }


  } finally {
    processingVoice =
      false;


    if (
      liveVisionEnabled &&
      liveVisionState
    ) {
      liveVisionState.textContent =
        'LIVE VISION WATCHING';
    }


    if (
      liveVoiceEnabled
    ) {
      setTimeout(
        beginVoiceTurn,
        180
      );

    } else {
      readyState();
    }
  }
}


/* ============================================================
   START LIVE VOICE
============================================================ */

async function startLiveVoice() {
  if (
    liveVoiceEnabled
  ) {
    return;
  }


  try {
    setVoiceState(
      'thinking',
      'Connecting local voice...'
    );


    const healthResponse =
      await fetch(
        `${VOICE_API}/health`
      );


    if (
      !healthResponse.ok
    ) {
      throw new Error(
        'Local Whisper unavailable.'
      );
    }


    micStream =
      await navigator
        .mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation:
              true,

            noiseSuppression:
              true,

            autoGainControl:
              true,

            channelCount:
              1
          },

          video:
            false
        });


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    audioContext =
      new AudioContextClass();


    if (
      audioContext.state ===
        'suspended'
    ) {
      await audioContext.resume();
    }


    analyser =
      audioContext
        .createAnalyser();


    analyser.fftSize =
      1024;


    analyser.smoothingTimeConstant =
      0.62;


    analyserSource =
      audioContext
        .createMediaStreamSource(
          micStream
        );


    analyserSource.connect(
      analyser
    );


    liveVoiceEnabled =
      true;


    updateLiveVoiceUI();


    beginVoiceTurn();

    monitorMicrophone();


    addSystemMessage(
      liveVisionEnabled
        ? 'Live Voice started with Live Vision.'
        : 'Live Voice started.'
    );


  } catch (
    error
  ) {
    liveVoiceEnabled =
      false;

    updateLiveVoiceUI();


    addSystemMessage(
      `Live Voice could not start: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }
}


/* ============================================================
   STOP LIVE VOICE
============================================================ */

async function stopLiveVoice() {
  liveVoiceEnabled =
    false;

  processingVoice =
    false;


  if (
    recorder &&
    recorder.state !==
      'inactive'
  ) {
    recorder.onstop =
      null;

    recorder.stop();
  }


  recorder =
    null;


  if (
    monitorAnimation
  ) {
    cancelAnimationFrame(
      monitorAnimation
    );

    monitorAnimation =
      null;
  }


  if (
    typeof speechSynthesis !==
      'undefined'
  ) {
    speechSynthesis.cancel();
  }


  novaSpeaking =
    false;


  if (
    micStream
  ) {
    micStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

    micStream =
      null;
  }


  if (
    analyserSource
  ) {
    try {
      analyserSource.disconnect();
    } catch {}

    analyserSource =
      null;
  }


  analyser =
    null;


  if (
    audioContext
  ) {
    try {
      await audioContext.close();
    } catch {}

    audioContext =
      null;
  }


  if (
    voiceMeter
  ) {
    voiceMeter.style.width =
      '0%';
  }


  if (
    liveVoiceState
  ) {
    liveVoiceState.textContent =
      'Press LIVE VOICE to begin';
  }


  updateLiveVoiceUI();

  readyState();
}


liveVoiceButton
  ?.addEventListener(
    'click',
    async () => {
      if (
        liveVoiceEnabled
      ) {
        await stopLiveVoice();

      } else {
        await startLiveVoice();
      }
    }
  );


/* ============================================================
   WEATHER
============================================================ */

function weatherCodeToText(
  code
) {
  const values = {
    0:
      'Clear',

    1:
      'Mostly Clear',

    2:
      'Partly Cloudy',

    3:
      'Overcast',

    45:
      'Fog',

    48:
      'Fog',

    51:
      'Light Drizzle',

    53:
      'Drizzle',

    55:
      'Heavy Drizzle',

    61:
      'Light Rain',

    63:
      'Rain',

    65:
      'Heavy Rain',

    71:
      'Light Snow',

    73:
      'Snow',

    75:
      'Heavy Snow',

    80:
      'Rain Showers',

    81:
      'Rain Showers',

    82:
      'Heavy Showers',

    95:
      'Thunderstorm',

    96:
      'Thunderstorm',

    99:
      'Thunderstorm'
  };


  return (
    values[code] ||
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
      'Unavailable';

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


/* ============================================================
   NEWS
============================================================ */

function updateNews(
  news
) {
  if (
    !newsList
  ) {
    return;
  }


  newsList.innerHTML =
    '';


  if (
    news?.success !==
      true ||
    !Array.isArray(
      news.headlines
    )
  ) {
    newsStatus.textContent =
      'OFFLINE';

    return;
  }


  newsStatus.textContent =
    'LIVE';


  for (
    const headline
    of news.headlines
  ) {
    const button =
      document.createElement(
        'button'
      );


    button.type =
      'button';


    button.className =
      'news-item';


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


    button.append(
      title,
      meta
    );


    button.onclick =
      () => {
        if (
          headline.link
        ) {
          window.novaAPI
            ?.openExternal?.(
              headline.link
            );
        }
      };


    newsList.appendChild(
      button
    );
  }
}


/* ============================================================
   DASHBOARD
============================================================ */

async function refreshDashboard() {
  try {
    const response =
      await fetch(
        `${NOVA_API}/dashboard`
      );


    if (
      !response.ok
    ) {
      throw new Error(
        'Dashboard offline'
      );
    }


    const data =
      await response.json();


    backendStatus.textContent =
      'ONLINE';


    backendStatus.classList.add(
      'online-text'
    );


    if (
      data.system?.success
    ) {
      cpuUsage.textContent =
        `${data.system.cpu_usage_percent ?? '--'}%`;

      ramUsage.textContent =
        `${data.system.memory_usage_percent ?? '--'}%`;
    }


    if (
      data.battery
        ?.battery_present
    ) {
      batteryLevel.textContent =
        `${data.battery.percentage ?? '--'}%`;

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


    bluetoothStatus.textContent =
      bluetooth
        ?.bluetooth_available
        ? 'AVAILABLE'
        : 'OFF';


    const devices =
      Array.isArray(
        bluetooth
          ?.active_devices
      )
        ? bluetooth.active_devices
        : [];


    const realDevice =
      devices.find(
        device =>
          Boolean(
            device?.name
          )
      );


    bluetoothDevice.textContent =
      realDevice?.name ||
      (
        bluetooth
          ?.bluetooth_available
          ? 'Bluetooth available'
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
    backendStatus.textContent =
      'OFFLINE';

    backendStatus.classList.remove(
      'online-text'
    );
  }
}


/* ============================================================
   MEDIA
============================================================ */

let mediaItems =
  [];

let mediaIndex =
  0;

let mediaTimer =
  null;


async function loadMedia() {
  try {
    mediaItems =
      await window.novaAPI
        ?.listMedia?.() ||
      [];


    if (
      mediaIndex >=
      mediaItems.length
    ) {
      mediaIndex =
        0;
    }


    showMedia();

    restartMediaTimer();

  } catch (
    error
  ) {
    console.error(
      error
    );
  }
}


function showMedia() {
  if (
    !mediaItems.length
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


  posterImage.src =
    item.url;
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
    mediaItems.length <
      2
  ) {
    return;
  }


  mediaTimer =
    setInterval(
      () => {
        mediaIndex =
          (
            mediaIndex +
            1
          ) %
          mediaItems.length;


        showMedia();
      },

      Number(
        settings.mediaRotationSpeed
      )
    );
}


/* ============================================================
   LOAD SETTINGS
============================================================ */

function loadSettingsUI() {
  if (
    cameraEnabledSetting
  ) {
    cameraEnabledSetting.checked =
      settings.cameraEnabled;
  }


  if (
    cameraSidebarSetting
  ) {
    cameraSidebarSetting.checked =
      settings.cameraSidebar;
  }


  if (
    cameraMirrorSetting
  ) {
    cameraMirrorSetting.checked =
      settings.cameraMirror;
  }


  if (
    voiceRepliesSetting
  ) {
    voiceRepliesSetting.checked =
      settings.voiceReplies;
  }


  if (
    enhancedAnimationsSetting
  ) {
    enhancedAnimationsSetting.checked =
      settings.enhancedAnimations;
  }


  if (
    mediaRotationSetting
  ) {
    mediaRotationSetting.checked =
      settings.mediaRotation;
  }


  if (
    mediaRotationSpeedSetting
  ) {
    mediaRotationSpeedSetting.value =
      String(
        settings.mediaRotationSpeed
      );
  }


  if (
    desktopNotificationsSetting
  ) {
    desktopNotificationsSetting.checked =
      settings.desktopNotifications;
  }


  if (
    batteryNotificationsSetting
  ) {
    batteryNotificationsSetting.checked =
      settings.batteryNotifications;
  }


  if (
    newsNotificationsSetting
  ) {
    newsNotificationsSetting.checked =
      settings.newsNotifications;
  }


  if (
    startupSetting
  ) {
    startupSetting.checked =
      settings.startup;
  }


  if (
    traySetting
  ) {
    traySetting.checked =
      settings.tray;
  }


  document.body.classList.toggle(
    'reduced-effects',
    !settings.enhancedAnimations
  );
}


/* ============================================================
   SETTINGS EVENTS
============================================================ */

cameraEnabledSetting
  ?.addEventListener(
    'change',
    async () => {
      settings.cameraEnabled =
        cameraEnabledSetting.checked;


      saveSettings();


      if (
        settings.cameraEnabled
      ) {
        await startCamera();

      } else {
        await stopCamera();
      }


      applyCameraVisibility();
    }
  );


cameraSidebarSetting
  ?.addEventListener(
    'change',
    () => {
      settings.cameraSidebar =
        cameraSidebarSetting.checked;

      saveSettings();

      applyCameraVisibility();
    }
  );


cameraMirrorSetting
  ?.addEventListener(
    'change',
    () => {
      settings.cameraMirror =
        cameraMirrorSetting.checked;

      saveSettings();

      applyCameraMirror();
    }
  );


cameraDeviceSelect
  ?.addEventListener(
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


voiceRepliesSetting
  ?.addEventListener(
    'change',
    () => {
      settings.voiceReplies =
        voiceRepliesSetting.checked;

      saveSettings();

      if (
        !liveVoiceEnabled
      ) {
        voiceStatus.textContent =
          settings.voiceReplies
            ? 'ENABLED'
            : 'OFF';
      }
    }
  );


enhancedAnimationsSetting
  ?.addEventListener(
    'change',
    () => {
      settings.enhancedAnimations =
        enhancedAnimationsSetting.checked;

      saveSettings();

      document.body.classList.toggle(
        'reduced-effects',
        !settings.enhancedAnimations
      );
    }
  );


mediaRotationSetting
  ?.addEventListener(
    'change',
    () => {
      settings.mediaRotation =
        mediaRotationSetting.checked;

      saveSettings();

      restartMediaTimer();
    }
  );


mediaRotationSpeedSetting
  ?.addEventListener(
    'change',
    () => {
      settings.mediaRotationSpeed =
        Number(
          mediaRotationSpeedSetting.value
        );

      saveSettings();

      restartMediaTimer();
    }
  );


desktopNotificationsSetting
  ?.addEventListener(
    'change',
    () => {
      settings.desktopNotifications =
        desktopNotificationsSetting.checked;

      saveSettings();
    }
  );


batteryNotificationsSetting
  ?.addEventListener(
    'change',
    () => {
      settings.batteryNotifications =
        batteryNotificationsSetting.checked;

      saveSettings();
    }
  );


newsNotificationsSetting
  ?.addEventListener(
    'change',
    () => {
      settings.newsNotifications =
        newsNotificationsSetting.checked;

      saveSettings();
    }
  );


startupSetting
  ?.addEventListener(
    'change',
    async () => {
      settings.startup =
        startupSetting.checked;

      saveSettings();


      try {
        const actual =
          await window.novaAPI
            ?.setStartup?.(
              settings.startup
            );


        if (
          typeof actual ===
          'boolean'
        ) {
          settings.startup =
            actual;

          startupSetting.checked =
            actual;

          saveSettings();
        }

      } catch (
        error
      ) {
        console.error(
          error
        );
      }
    }
  );


traySetting
  ?.addEventListener(
    'change',
    async () => {
      settings.tray =
        traySetting.checked;

      saveSettings();


      try {
        await window.novaAPI
          ?.setTray?.(
            settings.tray
          );

      } catch (
        error
      ) {
        console.error(
          error
        );
      }
    }
  );


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeNova() {
  loadSettingsUI();

  updateVisionUI();

  updateLiveVoiceUI();

  applyCameraVisibility();

  applyCameraMirror();


  if (
    typeof speechSynthesis !==
      'undefined'
  ) {
    speechSynthesis.getVoices();


    speechSynthesis.onvoiceschanged =
      () => {
        speechSynthesis.getVoices();
      };
  }


  await populateCameraDevices();


  if (
    settings.cameraEnabled
  ) {
    await startCamera();
  }


  try {
    const startup =
      await window.novaAPI
        ?.getStartup?.();


    if (
      typeof startup ===
      'boolean'
    ) {
      settings.startup =
        startup;

      startupSetting.checked =
        startup;
    }

  } catch {}


  try {
    await window.novaAPI
      ?.setTray?.(
        settings.tray
      );

  } catch {}


  await refreshDashboard();

  await loadMedia();


  setInterval(
    refreshDashboard,
    5000
  );


  setInterval(
    loadMedia,
    30000
  );


  readyState();

  messageInput?.focus();
}


initializeNova();