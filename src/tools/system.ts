import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition } from './types.js';

const execFileAsync = promisify(execFile);

type CpuTimes = {
  idle: number;
  total: number;
};

function getCpuTimes(): CpuTimes {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;

    total +=
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.idle +
      cpu.times.irq;
  }

  return {
    idle,
    total
  };
}

async function getCpuUsagePercent(): Promise<number> {
  const start = getCpuTimes();

  await new Promise(
    (resolve) =>
      setTimeout(resolve, 300)
  );

  const end = getCpuTimes();

  const idleDifference =
    end.idle - start.idle;

  const totalDifference =
    end.total - start.total;

  if (totalDifference <= 0) {
    return 0;
  }

  const usage =
    100 -
    (
      idleDifference /
      totalDifference
    ) *
      100;

  return Number(
    usage.toFixed(1)
  );
}

async function getGpuInfo() {
  try {
    const script = `
Get-CimInstance Win32_VideoController |
Select-Object Name, DriverVersion, AdapterRAM |
ConvertTo-Json -Compress
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

    if (!stdout.trim()) {
      return [];
    }

    const parsed =
      JSON.parse(
        stdout.trim()
      );

    const list =
      Array.isArray(parsed)
        ? parsed
        : [parsed];

    return list.map(
      (gpu: any) => ({
        name:
          gpu.Name || 'Unknown GPU',

        driver_version:
          gpu.DriverVersion || null,

        memory_gb:
          gpu.AdapterRAM
            ? Number(
                (
                  Number(gpu.AdapterRAM) /
                  1024 ** 3
                ).toFixed(2)
              )
            : null
      })
    );

  } catch {
    return [];
  }
}

export const systemTool:
ToolDefinition = {
  name:
    'get_system_info',

  description:
    'Get live Windows system information including CPU usage, RAM usage, uptime, processor details, and GPU information.',

  permission:
    'read_only',

  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false
  },

  async execute() {
    const totalMemory =
      os.totalmem();

    const freeMemory =
      os.freemem();

    const usedMemory =
      totalMemory -
      freeMemory;

    const memoryUsagePercent =
      (
        usedMemory /
        totalMemory
      ) *
      100;

    const cpuUsage =
      await getCpuUsagePercent();

    const gpu =
      await getGpuInfo();

    const cpus =
      os.cpus();

    return {
      success: true,

      hostname:
        os.hostname(),

      platform:
        os.platform(),

      architecture:
        os.arch(),

      processor:
        cpus[0]?.model ||
        'Unknown CPU',

      cpu_count:
        cpus.length,

      cpu_usage_percent:
        cpuUsage,

      total_memory_gb:
        Number(
          (
            totalMemory /
            1024 ** 3
          ).toFixed(2)
        ),

      used_memory_gb:
        Number(
          (
            usedMemory /
            1024 ** 3
          ).toFixed(2)
        ),

      free_memory_gb:
        Number(
          (
            freeMemory /
            1024 ** 3
          ).toFixed(2)
        ),

      memory_usage_percent:
        Number(
          memoryUsagePercent
            .toFixed(1)
        ),

      uptime_hours:
        Number(
          (
            os.uptime() /
            3600
          ).toFixed(2)
        ),

      gpu
    };
  }
};