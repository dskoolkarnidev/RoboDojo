import React, { useRef, useState } from 'react';
import { Terminal, CheckCircle2, Zap, HelpCircle } from 'lucide-react';
import type { UserProgress } from '../types/curriculum';
import { playSound } from '../utils/sound';

interface CliDojoProps {
  progress: UserProgress;
  onCompleteChallenge: (challengeId: string, xp: number) => void;
}

interface CliChallenge {
  id: string;
  title: string;
  prompt: string;
  hint: string;
  xp: number;
  matchCmd: (cmd: string) => boolean;
}

const CLI_CHALLENGES: CliChallenge[] = [
  {
    id: 'cli_nodes',
    title: 'Discover Active Graph Nodes',
    prompt: 'List all currently running ROS 2 nodes on the simulated autonomous rover.',
    hint: 'ros2 node list',
    xp: 25,
    matchCmd: (c) => c.trim() === 'ros2 node list',
  },
  {
    id: 'cli_topics_types',
    title: 'Inspect Topic Types & Graph',
    prompt: 'List all active topics along with their message types (`-t`).',
    hint: 'ros2 topic list -t',
    xp: 25,
    matchCmd: (c) => c.trim() === 'ros2 topic list -t',
  },
  {
    id: 'cli_qos_info',
    title: 'Diagnose QoS Mismatch',
    prompt: 'Inspect `/scan` topic with verbose QoS info (`--verbose`) to see publisher/subscriber profiles.',
    hint: 'ros2 topic info /scan --verbose',
    xp: 35,
    matchCmd: (c) =>
      c.trim() === 'ros2 topic info /scan --verbose' ||
      c.trim() === 'ros2 topic info -v /scan',
  },
  {
    id: 'cli_param_set',
    title: 'Hot-Tune Controller Gain',
    prompt: 'Set `max_vel_x` parameter on `/controller_server` to `0.8`.',
    hint: 'ros2 param set /controller_server max_vel_x 0.8',
    xp: 35,
    matchCmd: (c) => c.trim() === 'ros2 param set /controller_server max_vel_x 0.8',
  },
  {
    id: 'cli_lifecycle',
    title: 'Check Lifecycle State',
    prompt: 'Query the current lifecycle state of `/map_server`.',
    hint: 'ros2 lifecycle get /map_server',
    xp: 35,
    matchCmd: (c) => c.trim() === 'ros2 lifecycle get /map_server',
  },
];

export const CliDojo: React.FC<CliDojoProps> = ({ progress, onCompleteChallenge }) => {
  const [input, setInput] = useState('');
  const [maxVelX, setMaxVelX] = useState('0.5');
  const [history, setHistory] = useState<{ cmd?: string; out: string }[]>([
    {
      out: 'RoboDojo Simulated ROS 2 Jazzy Environment (ROS_DOMAIN_ID=42)\nType `help` for available commands, or solve the diagnostic missions on the left.',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const runCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    if (cmd === 'clear') {
      setHistory([]);
      return;
    }

    let out = '';
    if (cmd === 'help') {
      out = [
        'Available simulated commands:',
        '  ros2 node list',
        '  ros2 node info /nav_controller',
        '  ros2 topic list [-t]',
        '  ros2 topic info /scan [--verbose]',
        '  ros2 topic echo /cmd_vel',
        '  ros2 topic hz /scan',
        '  ros2 param list /controller_server',
        '  ros2 param set /controller_server max_vel_x <val>',
        '  ros2 service list',
        '  ros2 action list',
        '  ros2 lifecycle get /map_server',
        '  ros2 run tf2_tools view_frames',
        '  clear',
      ].join('\n');
    } else if (cmd === 'ros2 node list') {
      out = [
        '/ekf_filter_node',
        '/lidar_driver',
        '/map_server',
        '/controller_server',
        '/bt_navigator',
        '/nav_controller',
      ].join('\n');
    } else if (cmd.startsWith('ros2 node info')) {
      out = [
        '/nav_controller',
        '  Subscribers:',
        '    /odom: nav_msgs/msg/Odometry',
        '    /scan: sensor_msgs/msg/LaserScan',
        '  Publishers:',
        '    /cmd_vel: geometry_msgs/msg/Twist',
        '  Service Servers:',
        '    /nav_controller/describe_parameters: rcl_interfaces/srv/DescribeParameters',
        '  Action Clients:',
        '    /follow_path: nav2_msgs/action/FollowPath',
      ].join('\n');
    } else if (cmd === 'ros2 topic list') {
      out = ['/cmd_vel', '/imu/data', '/map', '/odom', '/scan', '/tf', '/tf_static'].join('\n');
    } else if (cmd === 'ros2 topic list -t') {
      out = [
        '/cmd_vel [geometry_msgs/msg/Twist]',
        '/imu/data [sensor_msgs/msg/Imu]',
        '/map [nav_msgs/msg/OccupancyGrid]',
        '/odom [nav_msgs/msg/Odometry]',
        '/scan [sensor_msgs/msg/LaserScan]',
        '/tf [tf2_msgs/msg/TFMessage]',
        '/tf_static [tf2_msgs/msg/TFMessage]',
      ].join('\n');
    } else if (cmd === 'ros2 topic info /scan --verbose' || cmd === 'ros2 topic info -v /scan') {
      out = [
        'Type: sensor_msgs/msg/LaserScan',
        'Publisher count: 1',
        '  Node name: lidar_driver',
        '  QoS profile:',
        '    Reliability: BEST_EFFORT',
        '    Durability: VOLATILE',
        'Subscription count: 1',
        '  Node name: controller_server',
        '  QoS profile:',
        '    Reliability: BEST_EFFORT',
        '    Durability: VOLATILE',
      ].join('\n');
    } else if (cmd.startsWith('ros2 topic echo /cmd_vel')) {
      out = [
        'linear:',
        '  x: 0.42',
        '  y: 0.0',
        '  z: 0.0',
        'angular:',
        '  x: 0.0',
        '  y: 0.0',
        '  z: -0.15',
        '---',
      ].join('\n');
    } else if (cmd === 'ros2 topic hz /scan') {
      out = 'average rate: 20.014\n  min: 0.049s max: 0.051s std dev: 0.00042s window: 20';
    } else if (cmd.startsWith('ros2 param list')) {
      out = `/controller_server:\n  max_vel_x (current: ${maxVelX})\n  min_vel_x\n  use_sim_time`;
    } else if (cmd.startsWith('ros2 param set /controller_server max_vel_x ')) {
      const val = cmd.split(' ').pop() ?? '0.8';
      setMaxVelX(val);
      out = `Set parameter successful: max_vel_x = ${val}`;
    } else if (cmd === 'ros2 service list') {
      out = ['/calibrate_imu', '/clear_entirely_local_costmap', '/map_server/load_map'].join('\n');
    } else if (cmd === 'ros2 action list') {
      out = ['/compute_path_to_pose', '/follow_path', '/navigate_to_pose'].join('\n');
    } else if (cmd === 'ros2 lifecycle get /map_server') {
      out = 'active [3]';
    } else if (cmd === 'ros2 run tf2_tools view_frames') {
      out = 'Listening to tf data for 5 seconds...\nGenerated frames.pdf: map -> odom -> base_link -> laser_frame';
    } else {
      out = `Command not recognized in simulator: '${cmd}'. Type 'help' to see supported ros2 commands.`;
    }

    // Check if command solves any challenge
    CLI_CHALLENGES.forEach((ch) => {
      if (ch.matchCmd(cmd) && !progress.completedCliChallenges.includes(ch.id)) {
        playSound('correct', progress.soundEnabled);
        onCompleteChallenge(ch.id, ch.xp);
      }
    });

    setHistory((h) => [...h, { cmd, out }]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Guided Diagnostic Missions */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            ROS 2 CLI Dojo
          </h1>
          <p className="text-xs text-slate-400">
            Inspect a live simulated rover graph. Complete all 5 diagnostic missions to earn XP
            and the DDS Graph Inspector badge.
          </p>

          <div className="space-y-2.5 pt-2">
            {CLI_CHALLENGES.map((ch) => {
              const done = progress.completedCliChallenges.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    done
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {ch.title}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> +{ch.xp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{ch.prompt}</p>
                  <button
                    onClick={() => setInput(ch.hint)}
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" /> Fill command: {ch.hint}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Interactive Terminal */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl bg-[#070b14] border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[560px]">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">
                dev@rover-orin:~/ros2_ws
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">ROS_DOMAIN_ID=42</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm space-y-3">
            {history.map((item, i) => (
              <div key={i} className="space-y-1">
                {item.cmd && (
                  <div className="text-emerald-400">
                    <span className="text-cyan-400">dev@rover:~$</span> {item.cmd}
                  </div>
                )}
                <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">{item.out}</pre>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runCommand(input);
              setInput('');
            }}
            className="border-t border-slate-800 bg-slate-950 px-4 py-3 flex items-center gap-2 font-mono text-sm"
          >
            <span className="text-cyan-400 shrink-0">dev@rover:~$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a ros2 command (e.g. ros2 node list)..."
              className="flex-1 bg-transparent text-emerald-300 placeholder:text-slate-600 focus:outline-none"
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
};
