'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Animated terminal replicating the REAL Armbian build framework Docker output.
 * Based on actual `./compile.sh build BOARD=nanopi-r6s BRANCH=current BUILD_MINIMAL=yes RELEASE=trixie`
 * Extracted from real Docker log — every emoji, every step is authentic.
 *
 * Aspect ratio: 16:10 (fixed via CSS aspect-ratio)
 */

interface Line {
  text: string;
  type:
    | 'cmd'
    | 'docker'
    | 'info'
    | 'ok'
    | 'compile'
    | 'dim'
    | 'blank'
    | 'header'
    | 'table'
    | 'driver'
    | 'patch';
}

const BUILD_LINES: Line[] = [
  // ── 1. Launch ──
  {
    text: '$ ./compile.sh build BOARD=nanopi-r6s BRANCH=current BUILD_MINIMAL=yes RELEASE=trixie',
    type: 'cmd',
  },
  { text: '', type: 'blank' },

  // ── 2. Docker container ──
  { text: '[🐳|🌿] Applying cmdline param [ BOARD → nanopi-r6s ]', type: 'docker' },
  { text: '[🐳|🌿] Applying cmdline param [ BRANCH → current ]', type: 'docker' },
  { text: '[🐳|🌿] Applying cmdline param [ RELEASE → trixie ]', type: 'docker' },
  { text: '', type: 'blank' },

  // ── 3. Board configuration ──
  { text: '[🐳|🌱] Starting single build process [ nanopi-r6s ]', type: 'info' },
  { text: '[🐳|🌱] Checking [ basic host setup ]', type: 'info' },
  { text: '[🐳|🌱] Build host OS release [ noble ]', type: 'dim' },
  { text: '[🐳|🌱] Build host architecture [ arm64 ]', type: 'dim' },
  { text: '', type: 'blank' },

  // ── 4. Sourcing configs ──
  { text: '[🐳|🌱] Sourcing board configuration [ config/boards/nanopi-r6s.conf ]', type: 'info' },
  { text: "[🐳|✅] BOARDFAMILY='rockchip-rk3588'", type: 'ok' },
  { text: "[🐳|✅] BOOTCONFIG='nanopi-r6s-rk3588s_defconfig'", type: 'ok' },
  {
    text: '[🐳|🌱] Sourcing family configuration [ config/sources/families/rockchip-rk3588.conf ]',
    type: 'info',
  },
  { text: '[🐳|🌿] Enabling extension [ rkbin-tools ]', type: 'docker' },
  { text: "[🐳|✅] KERNEL_MAJOR_MINOR='6.18'", type: 'ok' },
  { text: "[🐳|✅] LINUXFAMILY='rockchip64'", type: 'ok' },
  { text: "[🐳|✅] LINUXCONFIG='linux-rockchip64-current'", type: 'ok' },
  { text: '[🐳|🌱] Sourcing arch configuration [ arm64.conf ]', type: 'info' },
  { text: "[🐳|✅] KERNEL_COMPILER='aarch64-linux-gnu-'", type: 'ok' },
  { text: '', type: 'blank' },

  // ── 5. Extensions & networking ──
  { text: '[🐳|🌿] Enabling extension [ armbian-config ]', type: 'docker' },
  { text: '[🐳|🌿] Enabling extension [ net-systemd-networkd ]', type: 'docker' },
  { text: '[🐳|🌿] Enabling extension [ net-systemd-timesyncd ]', type: 'docker' },
  { text: '[🐳|🌱] Extension manager [ 16 Extension Methods, 37 implementations ]', type: 'dim' },
  { text: '', type: 'blank' },

  // ── 6. U-Boot resolution ──
  { text: '[🐳|🌱] nanopi-r6s [ Using mainline U-Boot / current ]', type: 'info' },
  { text: "[🐳|✅] BOOTSOURCE='https://github.com/u-boot/u-boot.git'", type: 'ok' },
  { text: "[🐳|✅] BOOTBRANCH='tag:v2025.10'", type: 'ok' },
  { text: "[🐳|🌱] mainline-kernel [ Using KERNELBRANCH='branch:linux-6.18.y' ]", type: 'info' },
  { text: "[🐳|✅] KERNELSOURCE='https://git.kernel.org/.../stable/linux.git'", type: 'ok' },
  { text: '', type: 'blank' },

  // ── 7. Configuration complete ──
  { text: '[🐳|🌱] Configuration prepared for BOARD build [ nanopi-r6s.conf ]', type: 'info' },
  {
    text: '[🐳|✨] Repeat Build Options (early) [ ./compile.sh build BOARD=nanopi-r6s ... ]',
    type: 'header',
  },
  { text: '', type: 'blank' },

  // ── 8. Host preparation ──
  { text: '[🐳|🌱] Preparing [ host ]', type: 'info' },
  { text: '[🐳|💖] Native arch build [ target arm64 on host arm64 ]', type: 'header' },
  { text: '[🐳|🔨]   arm64: ok', type: 'ok' },
  { text: '[🐳|🌱] Python3 version [ 3.12.3 ]', type: 'dim' },
  { text: '', type: 'blank' },

  // ── 9. Package aggregation ──
  { text: '[🐳|🌱] Aggregating packages [ rootfs ]', type: 'info' },
  { text: '[🐳|🔨]   Summary: debootstrap: 5 | rootfs: 49 | image: 3 | desktop: 0', type: 'dim' },
  { text: '', type: 'blank' },

  // ── 10. U-Boot artifact (cached) ──
  { text: '[🐳|🌱] artifact [ uboot :: uboot() ]', type: 'info' },
  {
    text: '[🐳|🌱] Artifact available in remote cache [ ghcr.io/armbian/os/uboot-nanopi-r6s-current ]',
    type: 'info',
  },
  {
    text: '[🐳|🔨]   Pulled [registry] ghcr.io/armbian/os/uboot-nanopi-r6s-current:2025.10-Se50b...',
    type: 'dim',
  },
  { text: '[🐳|🔨]   Digest: sha256:17b026d512df6f71c5232a680f79e420f61a8c6a...', type: 'dim' },
  {
    text: '[🐳|💖] artifact [ obtained from remote cache: uboot-nanopi-r6s-current ]',
    type: 'header',
  },
  { text: "[🐳|🌱] Reversioning package [ re-version to '26.05.0-trunk' ]", type: 'dim' },
  { text: '', type: 'blank' },

  // ── 11. Kernel artifact (NOT cached — build from source) ──
  { text: '[🐳|🌱] artifact [ kernel :: kernel() ]', type: 'info' },
  { text: '[🐳|🌱] Artifact is NOT available in remote cache', type: 'info' },
  {
    text: '[🐳|🌱] Kernel build starting [ linux-kernel-worktree/6.18__rockchip64__arm64 ]',
    type: 'info',
  },
  {
    text: '[🐳|💖] Kernel bare tree already exists [ /armbian/cache/git-bare/kernel ]',
    type: 'header',
  },
  {
    text: '[🐳|🌿] Fetching updates from remote repository [ kernel:6.18 linux-6.18.y ]',
    type: 'docker',
  },
  { text: "[🐳|🌿] Using Kernel git revision [ 44c944a679...  'Linux 6.18.21' ]", type: 'docker' },
  { text: '', type: 'blank' },

  // ── 12. Driver preparation ──
  { text: '[🐳|🌱] Creating patches for kernel drivers [ rockchip64-current ]', type: 'info' },
  { text: '[🐳|🌱] Preparing driver [ driver_generic_bring_back_ipx ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_wifi_injection ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtl8189ES ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtl8192EU ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtl8812EU_rtl8822EU ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtw88 ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtl8852bs ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_uwe5622 ]', type: 'driver' },
  { text: '[🐳|🌱] Preparing driver [ driver_rtl8723cs ]', type: 'driver' },
  { text: '', type: 'blank' },

  // ── 13. Kernel patching (206 patches) ──
  { text: '[🐳|🌱] Calling Python patching script for kernel', type: 'info' },
  {
    text: '[🐳|🔨]   Applying 206 patches from 155 files (1 driver + 154 regular)...',
    type: 'info',
  },
  { text: '', type: 'blank' },
  { text: '[🐳|🔨]   → 001/206: kernel-drivers (rockchip64-current)', type: 'patch' },
  {
    text: '[🐳|🔨]   → 002/206: add-board-helios64 (+654/-81) {rk3399-kobol-helios64.dts}',
    type: 'patch',
  },
  { text: '[🐳|🔨]   → 006/206: board-nanopc-t4-add-typec-dp (+116/-0)', type: 'patch' },
  { text: '[🐳|🔨]   → 010/206: board-nanopi-r3s-fix-leds (+31/-10)', type: 'patch' },
  { text: '[🐳|🔨]   → 025/206: general-add-overlay-compilation-support (+91)', type: 'patch' },
  { text: '[🐳|🔨]   → 048/206: rk35xx-drm-panthor-add-devfreq-support (+132)', type: 'patch' },
  { text: '[🐳|🔨]   → 103/206: rk3588-add-thermal-zone-nodes (+65)', type: 'patch' },
  { text: '[🐳|🔨]   → 156/206: rk3588-nanopi-r6s-enable-pcie-sata (+14)', type: 'patch' },
  { text: '[🐳|🔨]   → 206/206: board-rockpis-dts (+283) {rk3308-rock-pi-s.dts}', type: 'patch' },
  { text: '', type: 'blank' },
  { text: '[🐳|🔨]   All 206 patches applied cleanly ✅', type: 'ok' },
  { text: '', type: 'blank' },

  // ── 14. Kernel config ──
  {
    text: '[🐳|🌱] Using kernel config [ config/kernel/linux-rockchip64-current.config ]',
    type: 'info',
  },
  { text: '[🐳|🌱] Enabling eBPF and BTF info [ fully BTF & CO-RE enabled kernel ]', type: 'info' },
  { text: '', type: 'blank' },

  // ── 15. Kernel compilation ──
  { text: '[🐳|🔨] Compiling kernel with make -j$(nproc) ...', type: 'info' },
  { text: '', type: 'blank' },
  { text: '  CC      scripts/mod/empty.o', type: 'compile' },
  { text: '  CC      kernel/sched/core.o', type: 'compile' },
  { text: '  CC      drivers/gpu/drm/panthor/panthor_drv.o', type: 'compile' },
  { text: '  CC      drivers/net/ethernet/stmicro/stmmac/stmmac_main.o', type: 'compile' },
  { text: '  CC      drivers/pci/controller/dwc/pcie-dw-rockchip.o', type: 'compile' },
  { text: '  CC [M]  drivers/net/wireless/realtek/rtl8xxxu/8723b.o', type: 'compile' },
  { text: '  CC [M]  fs/btrfs/volumes.o', type: 'compile' },
  { text: '  CC [M]  drivers/net/wireless/ti/wl1251/main.o', type: 'compile' },
  { text: '  DTC     arch/arm64/boot/dts/rockchip/rk3588s-nanopi-r6s.dtb', type: 'compile' },
  { text: '  CC      sound/soc/rockchip/rockchip_i2s_tdm.o', type: 'compile' },
  { text: '  CC      drivers/mmc/host/dw_mmc-rockchip.o', type: 'compile' },
  { text: '  CC [M]  drivers/hwmon/pmbus/pmbus_core.o', type: 'compile' },
  { text: '  CC      drivers/mmc/core/core.o', type: 'compile' },
  { text: '  LD      vmlinux.o', type: 'compile' },
  { text: '  SORTTAB vmlinux', type: 'compile' },
  { text: '  OBJCOPY arch/arm64/boot/Image', type: 'compile' },
  { text: '', type: 'blank' },

  // ── 16. Kernel done ──
  { text: '[🐳|✅] Kernel compiled successfully', type: 'ok' },
  { text: '[🐳|🚸] Kernel version: 6.18.21-current-rockchip64', type: 'info' },
  { text: '', type: 'blank' },

  // ── 17. .deb packaging ──
  { text: '[🐳|💖] Creating kernel .deb packages...', type: 'header' },
  { text: '     linux-image-current-rockchip64_26.05.0-trunk_arm64.deb', type: 'dim' },
  { text: '     linux-dtb-current-rockchip64_26.05.0-trunk_arm64.deb', type: 'dim' },
  { text: '     linux-headers-current-rockchip64_26.05.0-trunk_arm64.deb', type: 'dim' },
  { text: '', type: 'blank' },

  // ── 18. Done ──
  { text: '[🐳|✨] Build completed in 18m 47s', type: 'ok' },
  { text: '', type: 'blank' },
  { text: '  ✓  output/debs/linux-image-current-rockchip64_26.05.0-trunk_arm64.deb', type: 'ok' },
  { text: '  ✓  Ready to flash with Armbian Imager', type: 'ok' },
];

// Timing
const LINE_INTERVAL = 100;
const COMPILE_INTERVAL = 50;
const DRIVER_INTERVAL = 70;
const PATCH_INTERVAL = 80;
const RESTART_DELAY = 5000;

export function BuildTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Track visibility — start/restart when in viewport, pause when out
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visibleRef.current;
        visibleRef.current = !!entry?.isIntersecting;
        if (entry?.isIntersecting && !wasVisible) {
          setCycle((c) => c + 1);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Run typing animation each cycle — restarts when re-entering viewport
  useEffect(() => {
    if (cycle === 0) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleCount(0);

    let elapsed = 300;
    BUILD_LINES.forEach((line, i) => {
      let interval = LINE_INTERVAL;
      if (line.type === 'compile') interval = COMPILE_INTERVAL;
      else if (line.type === 'driver') interval = DRIVER_INTERVAL;
      else if (line.type === 'patch') interval = PATCH_INTERVAL;
      else if (line.type === 'blank') interval = 150;
      elapsed += interval;
      timersRef.current.push(setTimeout(() => setVisibleCount(i + 1), elapsed));
    });

    // After animation completes, wait then restart if still visible
    timersRef.current.push(
      setTimeout(() => {
        if (visibleRef.current) setCycle((c) => c + 1);
      }, elapsed + RESTART_DELAY),
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [cycle]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div
      ref={containerRef}
      className="terminal-glass rounded-xl overflow-hidden h-[300px] sm:h-[350px] md:h-auto md:aspect-[16/10]"
    >
      <style>{`.build-term::-webkit-scrollbar{display:none}`}</style>

      {/* Header bar */}
      <div className="bg-[#18181b] px-4 py-2.5 border-b border-white/10 flex items-center gap-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="mx-auto flex items-center gap-2 text-[10px] text-[rgb(var(--fg-3))] font-mono font-medium tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          armbian build framework
        </div>
        <div className="w-12" />
      </div>

      {/* Terminal body — fills remaining space, auto-scrolls */}
      <div className="relative flex-1 h-[calc(100%-36px)]">
        {/* Top fade */}
        {visibleCount > 20 && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[rgba(10,10,12,0.95)] to-transparent z-10 pointer-events-none" />
        )}
        <div
          ref={scrollRef}
          className="build-term p-3 sm:p-4 font-mono text-[9px] sm:text-[10px] leading-[15px] sm:leading-[16px] h-full max-h-[350px] md:max-h-none overflow-y-auto pointer-events-none select-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {BUILD_LINES.slice(0, visibleCount).map((line, i) => (
            <TerminalLine key={i} line={line} />
          ))}

          {/* Blinking cursor */}
          {visibleCount < BUILD_LINES.length && (
            <span className="inline-block w-[5px] h-[11px] bg-gray-500 animate-pulse mt-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}

function TerminalLine({ line }: { line: Line }) {
  if (line.type === 'blank') return <div className="h-[5px]" />;

  if (line.type === 'cmd') {
    return (
      <div>
        <span className="text-emerald-400 select-none">$ </span>
        <span className="text-white font-medium">{line.text.slice(2)}</span>
      </div>
    );
  }

  if (line.type === 'docker') {
    return <div className="text-blue-400/70">{line.text}</div>;
  }

  if (line.type === 'info') {
    const m = line.text.match(/^(\[🐳\|.+?\])\s*(.*)/);
    if (m) {
      return (
        <div>
          <span className="text-yellow-400/80">{m[1]}</span>
          <span className="text-gray-300"> {m[2]}</span>
        </div>
      );
    }
    return <div className="text-gray-300">{line.text}</div>;
  }

  if (line.type === 'ok') {
    const m = line.text.match(/^(\[🐳\|.+?\])\s*(.*)/);
    if (m) {
      return (
        <div>
          <span className="text-emerald-400">{m[1]}</span>
          <span className="text-emerald-400/80"> {m[2]}</span>
        </div>
      );
    }
    if (line.text.trimStart().startsWith('✓') || line.text.includes('✅')) {
      return <div className="text-emerald-400 font-medium">{line.text}</div>;
    }
    return <div className="text-emerald-400">{line.text}</div>;
  }

  if (line.type === 'header') {
    const m = line.text.match(/^(\[🐳\|.+?\])\s*(.*)/);
    if (m) {
      return (
        <div>
          <span className="text-[rgb(var(--brand))]">{m[1]}</span>
          <span className="text-[rgb(var(--brand))] font-bold"> {m[2]}</span>
        </div>
      );
    }
    return <div className="text-[rgb(var(--brand))] font-bold">{line.text}</div>;
  }

  if (line.type === 'driver') {
    const m = line.text.match(/^(\[🐳\|🌱\])\s*Preparing driver \[ (.+?) \]/);
    if (m) {
      return (
        <div>
          <span className="text-gray-600">{m[1]}</span>
          <span className="text-gray-500"> Preparing driver [ </span>
          <span className="text-purple-400/70">{m[2]}</span>
          <span className="text-gray-500"> ]</span>
        </div>
      );
    }
    return <div className="text-gray-500">{line.text}</div>;
  }

  if (line.type === 'patch') {
    const m = line.text.match(/^(\[🐳\|🔨\]\s+→ \d+\/\d+:)\s*(.*)/);
    if (m) {
      return (
        <div>
          <span className="text-gray-600">{m[1]}</span>
          <span className="text-cyan-500/60"> {m[2]}</span>
        </div>
      );
    }
    return <div className="text-gray-500">{line.text}</div>;
  }

  if (line.type === 'compile') {
    const m = line.text.match(/^(\s+)([\w[\]]+)\s+(.*)/);
    if (m) {
      return (
        <div>
          <span className="text-gray-700">{m[1]}</span>
          <span className="text-sky-500/60">{m[2]}</span>
          <span className="text-gray-600"> {m[3]}</span>
        </div>
      );
    }
    return <div className="text-gray-600">{line.text}</div>;
  }

  if (line.type === 'dim') {
    return <div className="text-gray-600">{line.text}</div>;
  }

  if (line.type === 'table') {
    return <div className="text-gray-500">{line.text}</div>;
  }

  return <div className="text-gray-500">{line.text}</div>;
}
