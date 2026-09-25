import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

type BluetoothDevice = {
  name: string;
  status: string | null;
  instance_id: string | null;
};

async function runPowerShell(
  script: string
): Promise<string> {
  const { stdout } =
    await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        script
      ],
      {
        windowsHide: true,
        timeout: 12000,
        maxBuffer: 1024 * 1024
      }
    );

  return stdout.trim();
}

export const bluetoothTool:
ToolDefinition = {
  name:
    'get_bluetooth_status',

  description:
    'Get Windows Bluetooth adapter status and list Bluetooth devices known to the PC, including their names and current device status when available.',

  permission:
    'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const script = `
$adapters = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue |
Where-Object {
  $_.FriendlyName -match 'Bluetooth' -and
  $_.FriendlyName -notmatch 'Enumerator'
} |
Select-Object FriendlyName, Status, InstanceId

$devices = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue |
Where-Object {
  $_.FriendlyName -and
  $_.FriendlyName -notmatch 'Enumerator' -and
  $_.FriendlyName -notmatch 'Radio'
} |
Select-Object FriendlyName, Status, InstanceId

[PSCustomObject]@{
  adapters = @($adapters)
  devices = @($devices)
} | ConvertTo-Json -Depth 4 -Compress
`;

      const output =
        await runPowerShell(
          script
        );

      if (!output) {
        return {
          success: true,
          device: 'Windows',
          bluetooth_available: false,
          adapters: [],
          devices: []
        };
      }

      const parsed =
        JSON.parse(output);

      const adapters =
        Array.isArray(
          parsed.adapters
        )
          ? parsed.adapters
          : parsed.adapters
            ? [parsed.adapters]
            : [];

      const devices =
        Array.isArray(
          parsed.devices
        )
          ? parsed.devices
          : parsed.devices
            ? [parsed.devices]
            : [];

      const normalizedAdapters =
        adapters.map(
          (adapter: any) => ({
            name:
              adapter.FriendlyName ||
              'Bluetooth Adapter',

            status:
              adapter.Status ||
              null,

            instance_id:
              adapter.InstanceId ||
              null
          })
        );

      const normalizedDevices:
        BluetoothDevice[] =
        devices.map(
          (device: any) => ({
            name:
              device.FriendlyName ||
              'Unknown Bluetooth Device',

            status:
              device.Status ||
              null,

            instance_id:
              device.InstanceId ||
              null
          })
        );

      const activeDevices =
        normalizedDevices.filter(
          (device) =>
            String(
              device.status ||
              ''
            ).toLowerCase() ===
            'ok'
        );

      return {
        success: true,

        device:
          'Windows',

        bluetooth_available:
          normalizedAdapters.length >
          0,

        adapters:
          normalizedAdapters,

        devices:
          normalizedDevices,

        active_devices:
          activeDevices
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