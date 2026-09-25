import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

export const batteryTool: ToolDefinition = {
  name: 'get_battery_status',

  description:
    'Get the current Windows laptop battery percentage, charging state, and estimated status.',

  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {},
    required: []
  },

  async execute() {
    try {
      const script = `
$battery = Get-CimInstance Win32_Battery | Select-Object -First 1

if ($null -eq $battery) {
  [PSCustomObject]@{
    present = $false
  } | ConvertTo-Json -Compress
  exit
}

$statusMap = @{
  1 = 'Discharging'
  2 = 'AC Connected'
  3 = 'Fully Charged'
  4 = 'Low'
  5 = 'Critical'
  6 = 'Charging'
  7 = 'Charging High'
  8 = 'Charging Low'
  9 = 'Charging Critical'
  10 = 'Undefined'
  11 = 'Partially Charged'
}

[PSCustomObject]@{
  present = $true
  percentage = $battery.EstimatedChargeRemaining
  status_code = $battery.BatteryStatus
  status = $statusMap[[int]$battery.BatteryStatus]
  estimated_runtime_minutes = $battery.EstimatedRunTime
  name = $battery.Name
} | ConvertTo-Json -Compress
`;

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
            timeout: 8000
          }
        );

      const battery =
        JSON.parse(
          stdout.trim()
        );

      if (!battery.present) {
        return {
          success: true,
          device: 'Windows',
          battery_present: false
        };
      }

      return {
        success: true,
        device: 'Windows',
        battery_present: true,
        percentage:
          Number(
            battery.percentage ?? 0
          ),
        status:
          battery.status ||
          'Unknown',
        status_code:
          battery.status_code ?? null,
        estimated_runtime_minutes:
          battery.estimated_runtime_minutes ?? null,
        name:
          battery.name ||
          'Battery'
      };

    } catch (error) {
      return {
        success: false,
        device: 'Windows',

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }
};