import React, { useMemo, useState } from 'react';
import {
  Radio,
  Compass,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface SimulatorsHubProps {
  initialTab?: 'qos' | 'tf2' | 'pid';
}

type Reliability = 'RELIABLE' | 'BEST_EFFORT';
type Durability = 'TRANSIENT_LOCAL' | 'VOLATILE';

export const SimulatorsHub: React.FC<SimulatorsHubProps> = ({ initialTab = 'qos' }) => {
  const [tab, setTab] = useState<'qos' | 'tf2' | 'pid'>(initialTab);

  // --- QoS Simulator State ---
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
    return {
      compatible: issues.length === 0,
      issues,
    };
  }, [pubRel, pubDur, subRel, subDur]);

  // --- TF2 Kinematics State ---
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

    // Joint 1 in map frame
    const j1x = baseX;
    const j1y = baseY;
    // Joint 2 in map frame
    const j2x = j1x + L1 * Math.cos(th0 + th1);
    const j2y = j1y + L1 * Math.sin(th0 + th1);
    // End effector (camera_link) in map frame
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
      totalDeg: Math.round(((baseYawDeg + q1Deg + q2Deg) % 360 + 360) % 360),
      matrix: [
        [cosA, -sinA, camX],
        [sinA, cosA, camY],
        [0, 0, 1],
      ],
    };
  }, [baseX, baseY, baseYawDeg, q1Deg, q2Deg]);

  // --- PID Simulator State ---
  const [kp, setKp] = useState(1.8);
  const [ki, setKi] = useState(0.45);
  const [kd, setKd] = useState(0.35);
  const [setpoint, setSetpoint] = useState(1.0);
  const [antiWindup, setAntiWindup] = useState(true);
  const [disturbance, setDisturbance] = useState(false);

  const pidSim = useMemo(() => {
    const dt = 0.02;
    const steps = 250; // 5.0 seconds
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

      // Actuator saturation +/- 8.0
      const rawU = kp * err + ki * integral + kd * deriv;
      const u = Math.max(-8, Math.min(8, rawU));

      // Conditional integration anti-windup
      if (!antiWindup || (rawU === u)) {
        integral += err * dt;
      }

      // 2nd order plant: m=1.0, damping=0.8
      const extLoad = disturbance && t >= 2.0 && t <= 2.6 ? -3.0 : 0;
      const accel = u + extLoad - 0.8 * v - 0.2 * y;
      v += accel * dt;
      y += v * dt;

      if (y > maxY) maxY = y;
      if (riseTime === null && y >= 0.9 * setpoint) {
        riseTime = t;
      }
      points.push({ t, y });
    }

    const finalY = points[points.length - 1].y;
    const overshootPct =
      setpoint > 0 ? Math.max(0, ((maxY - setpoint) / setpoint) * 100) : 0;
    const ssError = Math.abs(setpoint - finalY);

    return { points, overshootPct, riseTime, ssError };
  }, [kp, ki, kd, setpoint, antiWindup, disturbance]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Interactive Robotics Simulators</h1>
          <p className="text-sm text-slate-400">
            Build deep systems intuition by breaking QoS rules, transforming frames, and tuning
            closed-loop controllers.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('qos')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'qos'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> QoS Matrix
          </button>
          <button
            onClick={() => setTab('tf2')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'tf2'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> TF2 &amp; Kinematics
          </button>
          <button
            onClick={() => setTab('pid')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'pid'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> PID Step Lab
          </button>
        </div>
      </div>

      {/* 1. QoS Compatibility Simulator */}
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

            {/* RxO Diagnostic Result */}
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
                  Note that Depth does not affect compatibility — it only sizes each endpoint&apos;s
                  local ring buffer.
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

      {/* 2. TF2 & 2D Kinematics Visualizer */}
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

            {/* Homogeneous Matrix */}
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
              {/* Grid */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect x="-150" y="-200" width="500" height="350" fill="url(#grid)" />

              {/* Map Origin Axes */}
              <line x1="0" y1="0" x2="45" y2="0" stroke="#ef4444" strokeWidth="2.5" />
              <line x1="0" y1="0" x2="0" y2="-45" stroke="#22c55e" strokeWidth="2.5" />
              <text x="8" y="16" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                map (0,0)
              </text>

              {/* Flip Y for standard robotics (+Y up in 2D view) */}
              <g transform="scale(1, -1)">
                {/* Link 1 */}
                <line
                  x1={tfData.j1x * 80}
                  y1={tfData.j1y * 80}
                  x2={tfData.j2x * 80}
                  y2={tfData.j2y * 80}
                  stroke="#38bdf8"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Link 2 */}
                <line
                  x1={tfData.j2x * 80}
                  y1={tfData.j2y * 80}
                  x2={tfData.camX * 80}
                  y2={tfData.camY * 80}
                  stroke="#a78bfa"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Base Chassis */}
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

                {/* Joint 2 */}
                <circle cx={tfData.j2x * 80} cy={tfData.j2y * 80} r="5" fill="#f8fafc" />
                {/* Camera End-Effector */}
                <circle cx={tfData.camX * 80} cy={tfData.camY * 80} r="6" fill="#f43f5e" />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* 3. PID Controller Step-Response Lab */}
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
              {/* Setpoint dashed line */}
              <line
                x1="0"
                y1={200 - (setpoint / 2.5) * 180}
                x2="500"
                y2={200 - (setpoint / 2.5) * 180}
                stroke="#38bdf8"
                strokeDasharray="6 4"
                strokeWidth="1.5"
              />
              {/* Response Curve */}
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
