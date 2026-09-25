import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

async function runCommand(
  command: string,
  args: string[]
): Promise<string> {
  const { stdout } = await execFileAsync(
    command,
    args,
    {
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 1024 * 1024
    }
  );

  return stdout;
}

async function runNetsh(
  args: string[]
): Promise<string> {
  return runCommand(
    'netsh',
    args
  );
}

function getValue(
  text: string,
  label: string
): string | null {
  const escaped =
    label.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const regex =
    new RegExp(
      `^\\s*${escaped}\\s*:\\s*(.+)$`,
      'mi'
    );

  const match =
    text.match(regex);

  return (
    match?.[1]?.trim() ||
    null
  );
}

function parseCurrentConnection(
  text: string
) {
  return {
    state:
      getValue(text, 'State'),

    ssid:
      getValue(text, 'SSID'),

    bssid:
      getValue(text, 'BSSID'),

    signal:
      getValue(text, 'Signal'),

    radio_type:
      getValue(
        text,
        'Radio type'
      ),

    channel:
      getValue(
        text,
        'Channel'
      ),

    authentication:
      getValue(
        text,
        'Authentication'
      ),

    cipher:
      getValue(
        text,
        'Cipher'
      ),

    receive_rate_mbps:
      getValue(
        text,
        'Receive rate (Mbps)'
      ),

    transmit_rate_mbps:
      getValue(
        text,
        'Transmit rate (Mbps)'
      )
  };
}

type NearbyNetwork = {
  ssid: string;
  authentication: string | null;
  encryption: string | null;
  bssids: {
    bssid: string;
    signal: string | null;
    channel: string | null;
  }[];
};

function parseNearbyNetworks(
  text: string
): NearbyNetwork[] {
  const lines =
    text.split(/\r?\n/);

  const networks:
    NearbyNetwork[] = [];

  let current:
    NearbyNetwork | null = null;

  let currentBssid:
    NearbyNetwork['bssids'][number] | null =
    null;

  for (const line of lines) {
    const ssidMatch =
      line.match(
        /^\s*SSID\s+\d+\s*:\s*(.*)$/i
      );

    if (ssidMatch) {
      current = {
        ssid:
          ssidMatch[1].trim() ||
          '<hidden>',

        authentication: null,
        encryption: null,
        bssids: []
      };

      networks.push(current);

      currentBssid = null;

      continue;
    }

    if (!current) {
      continue;
    }

    const authMatch =
      line.match(
        /^\s*Authentication\s*:\s*(.+)$/i
      );

    if (authMatch) {
      current.authentication =
        authMatch[1].trim();

      continue;
    }

    const encryptionMatch =
      line.match(
        /^\s*Encryption\s*:\s*(.+)$/i
      );

    if (encryptionMatch) {
      current.encryption =
        encryptionMatch[1].trim();

      continue;
    }

    const bssidMatch =
      line.match(
        /^\s*BSSID\s+\d+\s*:\s*(.+)$/i
      );

    if (bssidMatch) {
      currentBssid = {
        bssid:
          bssidMatch[1].trim(),

        signal: null,
        channel: null
      };

      current.bssids.push(
        currentBssid
      );

      continue;
    }

    if (!currentBssid) {
      continue;
    }

    const signalMatch =
      line.match(
        /^\s*Signal\s*:\s*(.+)$/i
      );

    if (signalMatch) {
      currentBssid.signal =
        signalMatch[1].trim();

      continue;
    }

    const channelMatch =
      line.match(
        /^\s*Channel\s*:\s*(.+)$/i
      );

    if (channelMatch) {
      currentBssid.channel =
        channelMatch[1].trim();
    }
  }

  return networks;
}

function parseSavedProfiles(
  text: string
): string[] {
  const profiles =
    Array.from(
      text.matchAll(
        /^\s*(?:All User Profile|User Profile)\s*:\s*(.+)$/gmi
      )
    )
      .map(
        (match) =>
          match[1].trim()
      )
      .filter(Boolean);

  return [
    ...new Set(profiles)
  ];
}

async function getDefaultGateway():
Promise<string | null> {
  try {
    const script = [
      '$route = Get-NetRoute',
      "-DestinationPrefix '0.0.0.0/0'",
      '| Where-Object {',
      "$_.NextHop -ne '0.0.0.0'",
      '}',
      '| Sort-Object RouteMetric,InterfaceMetric',
      '| Select-Object -First 1',
      '-ExpandProperty NextHop'
    ].join(' ');

    const output =
      await runCommand(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          script
        ]
      );

    return (
      output.trim() ||
      null
    );

  } catch {
    return null;
  }
}

function analyzeSecurity(
  networks: NearbyNetwork[]
) {
  const findings:
    {
      ssid: string;
      level:
        'info' |
        'warning' |
        'high';
      issue: string;
    }[] = [];

  for (
    const network
    of networks
  ) {
    const auth =
      (
        network.authentication ||
        ''
      ).toLowerCase();

    const encryption =
      (
        network.encryption ||
        ''
      ).toLowerCase();

    if (
      auth.includes('open')
    ) {
      findings.push({
        ssid: network.ssid,
        level: 'high',
        issue:
          'Network appears to be open with no Wi-Fi authentication.'
      });
    }

    if (
      auth.includes('wep') ||
      encryption.includes('wep')
    ) {
      findings.push({
        ssid: network.ssid,
        level: 'high',
        issue:
          'WEP is obsolete and should not be used.'
      });
    }

    if (
      auth.includes('wpa-personal') &&
      !auth.includes('wpa2') &&
      !auth.includes('wpa3')
    ) {
      findings.push({
        ssid: network.ssid,
        level: 'warning',
        issue:
          'Legacy WPA security detected; WPA2 or WPA3 is preferred.'
      });
    }

    if (
      encryption.includes('tkip')
    ) {
      findings.push({
        ssid: network.ssid,
        level: 'warning',
        issue:
          'TKIP encryption is outdated; AES/CCMP is preferred.'
      });
    }

    if (
      auth.includes('wpa3')
    ) {
      findings.push({
        ssid: network.ssid,
        level: 'info',
        issue:
          'WPA3 authentication detected.'
      });
    }
  }

  return findings;
}

export const wifiTool:
ToolDefinition = {
  name:
    'get_wifi_status',

  description:
    'Perform a Windows Wi-Fi status and security audit. Shows current connection details, nearby SSIDs and BSSIDs, signal strength, channels, authentication and encryption type, saved Wi-Fi profile names, default gateway, router admin URL, and basic security findings. Does not reveal Wi-Fi passwords.',

  permission:
    'read_only',

  parameters: {
    type: 'object',

    properties: {},

    required: []
  },

  async execute() {
    try {
      const [
        interfaceOutput,
        networkOutput,
        profileOutput,
        gateway
      ] =
        await Promise.all([
          runNetsh([
            'wlan',
            'show',
            'interfaces'
          ]),

          runNetsh([
            'wlan',
            'show',
            'networks',
            'mode=bssid'
          ]),

          runNetsh([
            'wlan',
            'show',
            'profiles'
          ]),

          getDefaultGateway()
        ]);

      const current =
        parseCurrentConnection(
          interfaceOutput
        );

      const nearby =
        parseNearbyNetworks(
          networkOutput
        );

      const savedProfiles =
        parseSavedProfiles(
          profileOutput
        );

      const securityFindings =
        analyzeSecurity(
          nearby
        );

      return {
        success: true,

        device:
          'Windows',

        current_connection:
          current,

        nearby_networks:
          nearby,

        saved_profiles:
          savedProfiles,

        default_gateway:
          gateway,

        router_admin_url:
          gateway
            ? `http://${gateway}`
            : null,

        security_findings:
          securityFindings,

        nearby_count:
          nearby.length
      };

    } catch (error) {
      return {
        success: false,

        device:
          'Windows',

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }
};