import React, { useEffect, useMemo, useState } from 'react';
import {
  Radio,
  Compass,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Navigation,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

export type SimTab = 'diffdrive' | 'qos' | 'tf2' | 'pid';

interface SimulatorsHubProps {
  initialTab?: SimTab;
}

type Reliability = 'RELIABLE' | 'BEST_EFFORT';
type Durability = 'TRANSIENT_LOCAL' | 'VOLATILE';

const OBSTACLES = [
  { x: 110, y: 80, r: 28 },
  { x: 290, y: 110, r: 34 },
  { x: 210, y: 230, r: 30 },
  { x: 380, y: 220, r: 26 },
];

export const SimulatorsHub: React.FC<SimulatorsHubProps> = ({ initialTab = 'diffdrive' }) => {
  const [tab, setTab] = useState<SimTab>(initialTab);

  // --- 1. Diff-Drive Kinematics + LiDAR Raycaster + Odometry Drift ---
  const [vL, setVL] = useState(0.5);
  const [vR, setVR] = useState(0.62);
  const [wheelSlip, setWheelSlip] = useState(0.08);
  const [simRunning, setSimRunning] = useState(true);
  const [pose, setPose] = useState({ x: 80, y: 160, th: 0, odomX: 80, odomY: 160, odomTh: 0 });
  const [trail, setTrail] = useState<{ x: number; y: number; ox: number; oy: number }[]>([]);

  const wheelbase = 0.45; // meters
  const pxPerMeter = 80;

  useEffect(() => {
    if (tab !== 'diffdrive' || !simRunning) return;
    const id = window.setInterval(() => {
      const dt = 0.05;
      const vTrue = 0.5 * (vR + vL);
      const wTrue = (vR - vL) / wheelbase;

      // Wheel slip corrupts measured left/right encoder velocities
      const vRMeas = vR * (1 - wheelSlip);
      const vMeas = 0.5 * (vRMeas + vL);
      const wMeas = (vRMeas - vL) / wheelbase;

      setPose((p) => {
        let nx = p.x + vTrue * Math.cos(p.th) * dt * pxPerMeter;
        let ny = p.y + vTrue * Math.sin(p.th) * dt * pxPerMeter;
        let nth = p.th + wTrue * dt;

        // Bounce softly off arena walls (460x300)
        if (nx < 25 || nx > 435) {
          nth = Math.PI - nth;
          nx = Math.max(25, Math.min(435, nx));
        }
        if (ny < 25 || ny > 275) {
          nth = -nth;
          ny = Math.max(25, Math.min(275, ny));
        }

        const nox = p.odomX + vMeas * Math.cos(p.odomTh) * dt * pxPerMeter;
        const noy = p.odomY + vMeas * Math.sin(p.odomTh) * dt * pxPerMeter;
        const noth = p.odomTh + wMeas * dt;

        setTrail((t) => [...t.slice(-90), { x: nx, y: ny, ox: nox, oy: noy }]);
        return { x: nx, y: ny, th: nth, odomX: nox, odomY: noy, odomTh: noth };
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [tab, simRunning, vL, vR, wheelSlip]);

  // Cast 18 simulated 2D LiDAR rays around robot pose
  const lidarRays = useMemo(() => {
    const rays: { x2: number; y2: number; dist: number }[] = [];
    const maxR = 140;
    for (let i = 0; i < 18; i++) {
      const angle = pose.th - Math.PI + (i / 18) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let hitDist = maxR;

      for (let d = 12; d <= maxR; d += 4) {
        const px = pose.x + dx * d;
        const py = pose.y + dy * d;
        if (px <= 4 || px >= 456 || py <= 4 || py >= 296) {
          hitDist = d;
          break;
        }
        const hitObs = OBSTACLES.some((o) => Math.hypot(px - o.x, py - o.y) <= o.r);
        if (hitObs) {
          hitDist = d;
          break;
        }
      }
      rays.push({
        x2: pose.x + dx * hitDist,
        y2: pose.y + dy * hitDist,
        dist: hitDist / pxPerMeter,
      });
    }
    return rays;
  }, [pose]);

  const linearV = 0.5 * (vR + vL);
  const angularW = (vR - vL) / wheelbase;
  const driftErr = Math.hypot(pose.x - pose.odomX, pose.y - pose.odomY) / pxPerMeter;

  // --- 2. QoS Simulator State ---
  const [pubRel, setPubRel] = useState<Reliability>('BEST_EFFORT');
  const [pubDur, setPubDur] = useState<Durability>('VOLATILE');
  const [pubDepth, setPubDepth] = useState<number>(5);
  const [subRel, setSubRel] = useState<Reliability>('RELIABLE');
  const [subDur, setSubDur] = useState<Durability>('VOLATILE');
  const [subDepth, setSubDepth] = useState<number>(10);

  const qosAnalysis = useMemo(() => {
    const issues: string[] = [];
    if (pubRel === 'BEST_EFFORT' && subRel === 'RELIABLE') {
      issues.push(
        'RELIABILITY MISMATCH: Subscriber requests RELIABLE, but Publisher only offers BEST_EFFORT. DDS will NOT connect!'
      );
    }
    if (pubDur === 'VOLATILE' && subDur === 'TRANSIENT_LOCAL') {
      issues.push(
        'DURABILITY MISMATCH: Subscriber requests TRANSIENT_LOCAL (latched history), but Publisher only offers VOLATILE. DDS will NOT connect!'
      );
    }
    return { compatible: issues.length === 0, issues };
  }, [pubRel, pubDur, subRel, subDur]);

  // --- 3. TF2 Kinematics State ---
  const [baseX, setBaseX] = useState(1.2);
  const [baseY, setBaseY] = useState(0.8);
  const [baseYawDeg, setBaseYawDeg] = useState(25);
  const [q1Deg, setQ1Deg] = useState(35);
  const [q2Deg, setQ2Deg] = useState(-45);

  const tfData = useMemo(() => {
    const deg2rad = (d: number) => (d * Math.PI) / 180;
    const th0 = deg2rad(baseYawDeg);
    const th1 = deg2rad(q1Deg);
    const th2 = deg2rad(q2Deg);
    const L1 = 0.7;
    const L2 = 0.55;
    const j1x = baseX;
    const j1y = baseY;
    const j2x = j1x + L1 * Math.cos(th0 + th1);
    const j2y = j1y + L1 * Math.sin(th0 + th1);
    const totalAngle = th0 + th1 + th2;
    const camX = j2x + L2 * Math.cos(totalAngle);
    const camY = j2y + L2 * Math.sin(totalAngle);
    const cosA = Math.cos(totalAngle);
    const sinA = Math.sin(totalAngle);
    return {
      j1x,
      j1y,
      j2x,
      j2y,
      camX,
      camY,
      totalDeg: Math.round((((baseYawDeg + q1Deg + q2Deg) % 360) + 360) % 360),
      matrix: [
        [cosA, -sinA, camX],
        [sinA, cosA, camY],
        [0, 0, 1],
      ],
    };
  }, [baseX, baseY, baseYawDeg, q1Deg, q2Deg]);

  // --- 4. PID Simulator State ---
  const [kp, setKp] = useState(1.8);
  const [ki, setKi] = useState(0.45);
  const [kd, setKd] = useState(0.35);
  const [setpoint, setSetpoint] = useState(1.0);
  const [antiWindup, setAntiWindup] = useState(true);
  const [disturbance, setDisturbance] = useState(false);

  const pidSim = useMemo(() => {
    const dt = 0.02;
    const steps = 250;
    let y = 0;
    let v = 0;
    let integral = 0;
    let prevErr = setpoint;
    const points: { t: number; y: number }[] = [];
    let maxY = 0;
    let riseTime: number | null = null;

    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      const err = setpoint - y;
      const deriv = (err - prevErr) / dt;
      prevErr = err;

      const rawU = kp * err + ki * integral + kd * deriv;
      const u = Math.max(-8, Math.min(8, rawU));
      if (!antiWindup || rawU === u) integral += err * dt;

      const extLoad = disturbance && t >= 2.0 && t <= 2.6 ? -3.0 : 0;
      const accel = u + extLoad - 0.8 * v - 0.2 * y;
      v += accel * dt;
      y += v * dt;

      if (y > maxY) maxY = y;
      if (riseTime === null && y >= 0.9 * setpoint) riseTime = t;
      points.push({ t, y });
    }

    const finalY = points[points.length - 1].y;
    const overshootPct = setpoint > 0 ? Math.max(0, ((maxY - setpoint) / setpoint) * 100) : 0;
    const ssError = Math.abs(setpoint - finalY);
    return { points, overshootPct, riseTime, ssError };
  }, [kp, ki, kd, setpoint, antiWindup, disturbance]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Interactive Robotics Simulators</h1>
          <p className="text-sm text-slate-400">
            Visual first-principles labs for C++ developers new to physical robotics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('diffdrive')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'diffdrive'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4" /> Diff-Drive &amp; LiDAR
          </button>
          <button
            onClick={() => setTab('qos')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'qos'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> QoS Matrix
          </button>
          <button
            onClick={() => setTab('tf2')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'tf2'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> TF2 &amp; Kinematics
          </button>
          <button
            onClick={() => setTab('pid')}
            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'pid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> PID Step Lab
          </button>
        </div>
      </div>

      {/* 1. Diff-Drive + LiDAR + Odometry Drift Lab */}
      {tab === 'diffdrive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Wheel Velocities &amp; Slip</h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSimRunning((r) => !r)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 cursor-pointer"
                >
                  {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setPose({ x: 80, y: 160, th: 0, odomX: 80, odomY: 160, odomTh: 0 });
                    setTrail([]);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Left Wheel v_L (m/s)</span>
                <span className="font-mono text-cyan-300">{vL.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-1}
                max={1.2}
                step={0.04}
                value={vL}
                onChange={(e) => setVL(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Right Wheel v_R (m/s)</span>
                <span className="font-mono text-cyan-300">{vR.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-1}
                max={1.2}
                step={0.04}
                value={vR}
                onChange={(e) => setVR(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Right-Wheel Slip Error (%)</span>
                <span className="font-mono text-rose-300">{Math.round(wheelSlip * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.25}
                step={0.01}
                value={wheelSlip}
                onChange={(e) => setWheelSlip(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Twist linear.x (v):</span>
                <span className="text-emerald-300">{linearV.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Twist angular.z (ω):</span>
                <span className="text-emerald-300">{angularW.toFixed(2)} rad/s</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Odom Drift Error:</span>
                <span className="text-amber-300">{driftErr.toFixed(2)} m</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Watch how tiny wheel slip makes the <span className="text-amber-300">dashed odometry ghost</span>{' '}
              diverge from the <span className="text-emerald-300">true robot</span> — that&apos;s why robots need IMU + SLAM!
            </p>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-extrabold text-white text-sm">
                2D Arena · LaserScan + True Pose (Green) vs Odometry Estimate (Amber)
              </span>
              <span className="font-mono text-slate-400">18 LiDAR rays</span>
            </div>

            <svg
              viewBox="0 0 460 300"
              className="w-full h-80 rounded-xl bg-[#070b14] border border-slate-800"
            >
              {/* Obstacles */}
              {OBSTACLES.map((o, idx) => (
                <circle
                  key={idx}
                  cx={o.x}
                  cy={o.y}
                  r={o.r}
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="2"
                />
              ))}

              {/* True Trail */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeOpacity="0.4"
                strokeWidth="2"
                points={trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              />
              {/* Odometry Drift Trail */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
                strokeWidth="2"
                points={trail.map((p) => `${p.ox.toFixed(1)},${p.oy.toFixed(1)}`).join(' ')}
              />

              {/* LiDAR Rays */}
              {lidarRays.map((r, i) => (
                <g key={i}>
                  <line
                    x1={pose.x}
                    y1={pose.y}
                    x2={r.x2}
                    y2={r.y2}
                    stroke="#f43f5e"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                  />
                  <circle cx={r.x2} cy={r.y2} r="2.2" fill="#fb7185" />
                </g>
              ))}

              {/* Ghost Odometry Pose */}
              <g
                transform={`translate(${pose.odomX}, ${pose.odomY}) rotate(${
                  (pose.odomTh * 180) / Math.PI
                })`}
              >
                <rect
                  x="-12"
                  y="-10"
                  width="24"
                  height="20"
                  rx="4"
                  fill="none"
                  stroke="#f59e0b"
                  strokeDasharray="3 2"
                  strokeWidth="1.5"
                />
              </g>

              {/* True Robot Pose */}
              <g transform={`translate(${pose.x}, ${pose.y}) rotate(${(pose.th * 180) / Math.PI})`}>
                <rect
                  x="-12"
                  y="-10"
                  width="24"
                  height="20"
                  rx="4"
                  fill="#10b981"
                  fillOpacity="0.35"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <line x1="0" y1="0" x2="15" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 2. QoS Compatibility Simulator */}
      {tab === 'qos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Publisher (Offered QoS)</h2>
              <span className="text-xs font-mono text-cyan-400">/sensor_topic</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">Reliability</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['RELIABLE', 'BEST_EFFORT'] as Reliability[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setPubRel(r)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        pubRel === r
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">Durability</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TRANSIENT_LOCAL', 'VOLATILE'] as Durability[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPubDur(d)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        pubDur === d
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 flex justify-between mb-1">
                  <span>History Depth (KEEP_LAST)</span>
                  <span className="font-mono text-cyan-300">{pubDepth}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={pubDepth}
                  onChange={(e) => setPubDepth(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-500 mb-2">Quick Presets</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setPubRel('BEST_EFFORT');
                    setPubDur('VOLATILE');
                    setSubRel('RELIABLE');
                    setSubDur('VOLATILE');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-rose-300 cursor-pointer"
                >
                  LiDAR + Default Sub (Bug!)
                </button>
                <button
                  onClick={() => {
                    setPubRel('RELIABLE');
                    setPubDur('TRANSIENT_LOCAL');
                    setSubRel('RELIABLE');
                    setSubDur('TRANSIENT_LOCAL');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-300 cursor-pointer"
                >
                  /map Latched Match
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <h2 className="text-base font-extrabold text-white">Subscriber (Requested QoS)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Reliability
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['RELIABLE', 'BEST_EFFORT'] as Reliability[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setSubRel(r)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          subRel === r
                            ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Durability
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['TRANSIENT_LOCAL', 'VOLATILE'] as Durability[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSubDur(d)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          subDur === d
                            ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 flex justify-between mb-1">
                  <span>Subscriber Depth</span>
                  <span className="font-mono text-violet-300">{subDepth}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={subDepth}
                  onChange={(e) => setSubDepth(Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>
            </div>

            <div
              className={`rounded-2xl border p-6 space-y-3 ${
                qosAnalysis.compatible
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : 'bg-rose-950/40 border-rose-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {qosAnalysis.compatible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                )}
                <h3 className="text-lg font-extrabold text-white">
                  {qosAnalysis.compatible
                    ? 'DDS Match: Messages Flowing'
                    : 'DDS Incompatible QoS: 0 Messages Delivered'}
                </h3>
              </div>

              {qosAnalysis.compatible ? (
                <p className="text-sm text-emerald-200/90">
                  Offered QoS ({pubRel}, {pubDur}) satisfies Requested QoS ({subRel}, {subDur}).
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {qosAnalysis.issues.map((iss, i) => (
                    <li key={i} className="text-sm text-rose-200 font-medium">
                      • {iss}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TF2 & 2D Kinematics Visualizer */}
      {tab === 'tf2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" /> Transform Chain Controls
            </h2>

            {[
              { label: 'odom → base_link X (m)', val: baseX, set: setBaseX, min: -1, max: 3, step: 0.1 },
              { label: 'odom → base_link Y (m)', val: baseY, set: setBaseY, min: -1, max: 2.5, step: 0.1 },
              { label: 'base_link Yaw (deg)', val: baseYawDeg, set: setBaseYawDeg, min: -180, max: 180, step: 5 },
              { label: 'arm_joint_1 (deg)', val: q1Deg, set: setQ1Deg, min: -135, max: 135, step: 5 },
              { label: 'arm_joint_2 (deg)', val: q2Deg, set: setQ2Deg, min: -135, max: 135, step: 5 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-mono text-violet-300">{s.val}</span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.val}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-2">
                T_map_camera (SE(2) Homogeneous Matrix)
              </div>
              <div className="font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-emerald-300">
                {tfData.matrix.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 text-right">
                    {row.map((v, c) => (
                      <span key={c}>{v.toFixed(3)}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-white">2D World Frame (map)</h2>
              <span className="text-xs font-mono text-slate-400">
                camera_link: ({tfData.camX.toFixed(2)}m, {tfData.camY.toFixed(2)}m,{' '}
                {tfData.totalDeg}°)
              </span>
            </div>

            <svg
              viewBox="-150 -200 500 350"
              className="w-full h-80 rounded-xl bg-[#070b14] border border-slate-800"
            >
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="-150" y="-200" width="500" height="350" fill="url(#grid)" />

              <line x1="0" y1="0" x2="45" y2="0" stroke="#ef4444" strokeWidth="2.5" />
              <line x1="0" y1="0" x2="0" y2="-45" stroke="#22c55e" strokeWidth="2.5" />
              <text x="8" y="16" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                map (0,0)
              </text>

              <g transform="scale(1, -1)">
                <line
                  x1={tfData.j1x * 80}
                  y1={tfData.j1y * 80}
                  x2={tfData.j2x * 80}
                  y2={tfData.j2y * 80}
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <line
                  x1={tfData.j2x * 80}
                  y1={tfData.j2y * 80}
                  x2={tfData.camX * 80}
                  y2={tfData.camY * 80}
                  stroke="#a78bfa"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <g
                  transform={`translate(${tfData.j1x * 80}, ${tfData.j1y * 80}) rotate(${baseYawDeg})`}
                >
                  <rect
                    x="-18"
                    y="-14"
                    width="36"
                    height="28"
                    rx="5"
                    fill="#10b981"
                    fillOpacity="0.3"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <line x1="0" y1="0" x2="24" y2="0" stroke="#ef4444" strokeWidth="2" />
                </g>

                <circle cx={tfData.j2x * 80} cy={tfData.j2y * 80} r="5" fill="#f8fafc" />
                <circle cx={tfData.camX * 80} cy={tfData.camY * 80} r="6" fill="#f43f5e" />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 4. PID Controller Step-Response Lab */}
      {tab === 'pid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h2 className="text-base font-extrabold text-white">PID Gains &amp; Plant</h2>

            {[
              { label: 'Kp (Proportional)', val: kp, set: setKp, min: 0, max: 6, step: 0.1 },
              { label: 'Ki (Integral)', val: ki, set: setKi, min: 0, max: 3, step: 0.05 },
              { label: 'Kd (Derivative)', val: kd, set: setKd, min: 0, max: 2, step: 0.05 },
              { label: 'Setpoint (Target)', val: setpoint, set: setSetpoint, min: 0.5, max: 2, step: 0.1 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-mono text-amber-300">{s.val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.val}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer">
                <span>Integral Anti-Windup</span>
                <input
                  type="checkbox"
                  checked={antiWindup}
                  onChange={(e) => setAntiWindup(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer">
                <span>Inject Load Disturbance (t=2.0s)</span>
                <input
                  type="checkbox"
                  checked={disturbance}
                  onChange={(e) => setDisturbance(e.target.checked)}
                  className="accent-rose-400 w-4 h-4"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Overshoot</div>
                <div className="text-lg font-mono font-extrabold text-amber-300">
                  {pidSim.overshootPct.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Rise Time (90%)</div>
                <div className="text-lg font-mono font-extrabold text-cyan-300">
                  {pidSim.riseTime !== null ? `${pidSim.riseTime.toFixed(2)}s` : 'N/A'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Steady-State Error</div>
                <div className="text-lg font-mono font-extrabold text-emerald-300">
                  {pidSim.ssError.toFixed(3)}
                </div>
              </div>
            </div>

            <svg
              viewBox="0 0 500 220"
              className="w-full h-64 rounded-xl bg-[#070b14] border border-slate-800"
            >
              <line
                x1="0"
                y1={200 - (setpoint / 2.5) * 180}
                x2="500"
                y2={200 - (setpoint / 2.5) * 180}
                stroke="#38bdf8"
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={pidSim.points
                  .map((p) => {
                    const x = (p.t / 5.0) * 500;
                    const y = Math.max(5, Math.min(215, 200 - (p.y / 2.5) * 180));
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
