import type { Unit } from '../types/curriculum';

export const CURRICULUM_UNITS: Unit[] = [
  {
    id: 'unit_1',
    number: 1,
    title: 'ROS 2 Architecture & DDS',
    description:
      'Master the computation graph, DDS discovery, QoS compatibility, and multi-threaded executors without deadlocks.',
    color: 'emerald',
    badgeName: 'DDS & Executor Master',
    nodes: [
      {
        id: 'u1_n1',
        unitId: 'unit_1',
        title: 'Nodes, Graph & DDS Discovery',
        subtitle: 'Why ROS 2 dropped roscore and how RTPS discovery works',
        kind: 'lesson',
        estimatedMinutes: 8,
        xpReward: 40,
        keyTakeaways: [
          'ROS 2 uses DDS (Data Distribution Service) for decentralized peer-to-peer discovery — no single point of failure like ROS 1 roscore.',
          'ROS_DOMAIN_ID partitions DDS multicast UDP ports (default 0); isolating robots on the same LAN requires distinct Domain IDs.',
          'Intra-process communication passes std::unique_ptr zero-copy within the same OS process via Composable Nodes.',
        ],
        exercises: [
          {
            id: 'u1_n1_e1',
            type: 'multiple-choice',
            prompt:
              'Two robots on the same factory Wi-Fi both publish to `/cmd_vel` and `/scan`. What is the cleanest, zero-code ROS 2 mechanism to prevent their topics from colliding?',
            options: [
              'Run a separate roscore on different ports',
              'Assign each robot a unique ROS_DOMAIN_ID environment variable',
              'Use Reliable QoS on Robot A and Best-Effort on Robot B',
              'Disable DDS completely and use TCPROS',
            ],
            correctIndex: 1,
            explanation:
              'DDS computes UDP discovery ports from ROS_DOMAIN_ID (0–101). Setting distinct ROS_DOMAIN_ID values isolates each robot’s DDS domain at the transport layer.',
            seniorTip:
              'For large fleets (>50 nodes/robot), pair ROS_DOMAIN_ID with a DDS Discovery Server (e.g., FastDDS Discovery Server) to avoid UDP multicast storms on Wi-Fi.',
          },
          {
            id: 'u1_n1_e2',
            type: 'architecture-tradeoff',
            prompt:
              'Your perception pipeline passes 12 MB 4K RGB-D PointCloud2 frames at 30 Hz between 3 C++ nodes on an NVIDIA Orin. Serialization is saturating CPU. What should you do?',
            options: [
              'Rewrite all nodes in Python rclpy for GIL parallelism',
              'Load them into a single ComponentContainer with use_intra_process_comms=True',
              'Switch QoS Durability to Transient Local',
              'Increase topic queue depth to 100',
            ],
            correctIndex: 1,
            explanation:
              'ROS 2 Composable Nodes inside a ComponentContainer with intra-process communication pass `std::unique_ptr<MsgT>` directly in memory, bypassing DDS serialization and sockets entirely.',
            seniorTip:
              'Note: In rclcpp, zero-copy intra-process requires publishing via `std::unique_ptr` (not const ref) so ownership transfers cleanly.',
          },
          {
            id: 'u1_n1_e3',
            type: 'code-fill',
            prompt:
              'Complete the Python launch snippet to load a C++ ComposableNode with zero-copy intra-process comms enabled:',
            language: 'python',
            codeSnippet: `ComposableNode(
    package='camera_proc',
    plugin='camera_proc::RectifyNode',
    name='rectify',
    extra_arguments=[{'____': True}]
)`,
            options: [
              'use_intra_process_comms',
              'zero_copy_transport',
              'use_sim_time',
              'enable_dds_shm',
            ],
            correctIndex: 0,
            explanation:
              '`use_intra_process_comms: True` in `extra_arguments` instructs the ComponentManager to allocate the intra-process buffer ring.',
          },
        ],
      },
      {
        id: 'u1_n2',
        unitId: 'unit_1',
        title: 'QoS Compatibility & Profiles',
        subtitle: 'Reliability, Durability, Liveliness & silent topic drops',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 50,
        linkedSimTab: 'qos',
        keyTakeaways: [
          'RxO (Request vs Offered): A subscriber cannot demand a stronger QoS guarantee than the publisher offers.',
          'Reliable Subscriber + Best-Effort Publisher = INCOMPATIBLE (zero messages delivered, only a QoS event warning).',
          'Transient Local Durability caches the last N messages for late-joining subscribers (essential for /map and /robot_description).',
        ],
        exercises: [
          {
            id: 'u1_n2_e1',
            type: 'spot-the-bug',
            prompt:
              'You launch `rviz2` after `/map_server` has already published `/map` once. RViz shows "No map received". What is the most likely QoS bug?',
            codeSnippet: `# map_publisher.py
qos = QoSProfile(
    reliability=ReliabilityPolicy.RELIABLE,
    durability=DurabilityPolicy.VOLATILE,
    depth=1
)
self.pub = self.create_publisher(OccupancyGrid, '/map', qos)`,
            language: 'python',
            options: [
              'Depth=1 is too small for OccupancyGrid',
              'Durability is VOLATILE instead of TRANSIENT_LOCAL, so late joiners miss the latched map',
              'Reliability must be BEST_EFFORT for /map',
              'Topic name /map cannot have a leading slash',
            ],
            correctIndex: 1,
            explanation:
              'In ROS 2, `TRANSIENT_LOCAL` durability replaces ROS 1 `latch=True`. With `VOLATILE`, any subscriber connecting after the single publish receives nothing.',
            seniorTip:
              'Remember: BOTH publisher and subscriber must use `TRANSIENT_LOCAL` (or sub uses `VOLATILE`, which is weaker) to match!',
          },
          {
            id: 'u1_n2_e2',
            type: 'multiple-choice',
            prompt:
              'A LiDAR driver publishes `/scan` with `BEST_EFFORT` reliability. Which subscriber QoS will successfully receive messages?',
            options: [
              'RELIABLE + VOLATILE',
              'BEST_EFFORT + TRANSIENT_LOCAL',
              'BEST_EFFORT + VOLATILE',
              'RELIABLE + TRANSIENT_LOCAL',
            ],
            correctIndex: 2,
            explanation:
              'By DDS RxO rules, a Best-Effort publisher can only serve Best-Effort subscribers, and a Volatile publisher can only serve Volatile subscribers.',
          },
          {
            id: 'u1_n2_e3',
            type: 'multiple-choice',
            prompt:
              'Which QoS policy lets a safety supervisor detect within 200ms that a motor controller node crashed or hung?',
            options: [
              'HistoryPolicy.KEEP_ALL',
              'Deadline / Liveliness QoS with event callbacks',
              'DurabilityPolicy.TRANSIENT_LOCAL',
              'Depth = 1',
            ],
            correctIndex: 1,
            explanation:
              'Deadline QoS fires an `on_requested_deadline_missed` callback if a message isn’t received within the period; Liveliness detects dead participants.',
          },
        ],
      },
      {
        id: 'u1_n3',
        unitId: 'unit_1',
        title: 'Executors & Callback Groups',
        subtitle: 'Avoiding single-threaded deadlocks in async robotics',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 65,
        linkedLabId: 'lab_reentrant_executor',
        keyTakeaways: [
          'SingleThreadedExecutor runs all callbacks sequentially on 1 thread — blocking inside a callback stalls timers, subscriptions, and service responses.',
          'All callbacks in a node default to a single MutuallyExclusiveCallbackGroup.',
          'To run callbacks concurrently, combine a MultiThreadedExecutor with ReentrantCallbackGroup or separate MutuallyExclusiveCallbackGroups.',
        ],
        exercises: [
          {
            id: 'u1_n3_e1',
            type: 'spot-the-bug',
            prompt:
              'Why does this node hang forever on `rclpy.spin_until_future_complete` or `future.result()` inside `timer_cb`?',
            codeSnippet: `class PlannerNode(Node):
    def __init__(self):
        super().__init__('planner')
        self.cli = self.create_client(GetPlan, '/compute_plan')
        self.timer = self.create_timer(1.0, self.timer_cb)

    def timer_cb(self):
        fut = self.cli.call_async(GetPlan.Request())
        while not fut.done():
            time.sleep(0.01) # <-- hangs!`,
            language: 'python',
            options: [
              'GetPlan.Request() is missing a header',
              'Blocking inside timer_cb starves the SingleThreadedExecutor, so the service response callback can never run',
              'time.sleep(0.01) is too short for DDS',
              'create_client must be called after create_timer',
            ],
            correctIndex: 1,
            explanation:
              'The executor thread is trapped inside `timer_cb` spinning on `fut.done()`. Because the service client response is also scheduled on that same executor, `fut` will never complete.',
            seniorTip:
              'Prefer `fut.add_done_callback(self.on_plan_ready)` for non-blocking async, or use `ReentrantCallbackGroup` + `MultiThreadedExecutor`.',
          },
          {
            id: 'u1_n3_e2',
            type: 'architecture-tradeoff',
            prompt:
              'You want Timer A (100 Hz control loop) and Timer B (1 Hz heavy path planning) to run in parallel, while preventing Timer B from ever overlapping with itself. Best setup?',
            options: [
              'Put both in one ReentrantCallbackGroup with SingleThreadedExecutor',
              'Put Timer A in MutuallyExclusiveCallbackGroup #1, Timer B in MutuallyExclusiveCallbackGroup #2, and use MultiThreadedExecutor',
              'Use one MutuallyExclusiveCallbackGroup for both with MultiThreadedExecutor',
              'Set QoS depth=1 on both timers',
            ],
            correctIndex: 1,
            explanation:
              'Different MutuallyExclusiveCallbackGroups can execute concurrently across threads in a MultiThreadedExecutor, while each group guarantees its own callbacks never re-enter themselves.',
          },
        ],
      },
      {
        id: 'u1_n4',
        unitId: 'unit_1',
        title: 'Unit 1 Boss: Production Graph Audit',
        subtitle: 'Diagnose QoS, DDS & concurrency failures under pressure',
        kind: 'boss',
        estimatedMinutes: 10,
        xpReward: 90,
        keyTakeaways: [
          'Combine Domain IDs, QoS RxO rules, Composable Nodes, and Callback Groups to debug distributed ROS 2 systems.',
        ],
        exercises: [
          {
            id: 'u1_n4_e1',
            type: 'sequence-order',
            prompt:
              'Order the lifecycle of a ROS 2 DDS message from publisher call to subscriber callback (top = first):',
            options: [
              'User calls pub.publish(msg)',
              'rmw layer serializes msg to CDR (unless intra-process zero-copy)',
              'DDS DataWriter transmits over UDP/SHM to matched DataReaders',
              'Executor WaitSet wakes up and dispatches subscription callback',
            ],
            correctOrder: [
              'User calls pub.publish(msg)',
              'rmw layer serializes msg to CDR (unless intra-process zero-copy)',
              'DDS DataWriter transmits over UDP/SHM to matched DataReaders',
              'Executor WaitSet wakes up and dispatches subscription callback',
            ],
            explanation:
              'Understanding the `rcl -> rmw -> DDS -> WaitSet -> Executor` pipeline makes performance profiling and QoS debugging straightforward.',
          },
          {
            id: 'u1_n4_e2',
            type: 'spot-the-bug',
            prompt:
              'In `rclcpp`, why does this node fail to achieve zero-copy intra-process communication?',
            codeSnippet: `auto msg = sensor_msgs::msg::Image();
// ... fill image ...
pub_->publish(msg);`,
            language: 'cpp',
            options: [
              'Image messages cannot use intra-process comms',
              'Passing by const reference forces a copy; you must publish std::unique_ptr via std::move(msg)',
              'rclcpp requires Python for zero-copy',
              'Missing rclcpp::spin_some()',
            ],
            correctIndex: 1,
            explanation:
              'In `rclcpp`, `publish(const MsgT&)` cannot transfer ownership, so DDS/intra-process must copy. Use `auto msg = std::make_unique<Image>(); pub_->publish(std::move(msg));`.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_2',
    number: 2,
    title: 'Pub/Sub, Services, Actions & Lifecycle',
    description:
      'Choose the right IPC primitive, design preemptable long-running Actions, and manage deterministic robot startup with Lifecycle Nodes.',
    color: 'sky',
    badgeName: 'IPC & Lifecycle Architect',
    nodes: [
      {
        id: 'u2_n1',
        unitId: 'unit_2',
        title: 'Topics vs Services vs Actions',
        subtitle: 'Choosing the right ROS 2 communication primitive',
        kind: 'lesson',
        estimatedMinutes: 8,
        xpReward: 45,
        keyTakeaways: [
          'Topics: continuous many-to-many data streams (sensor data, /cmd_vel, /odom).',
          'Services: fast, short-lived RPC request/response (trigger calibration, query IK) — never block for seconds.',
          'Actions: long-running, goal-oriented tasks with periodic feedback and preemption/cancellation (NavigateToPose, FollowJointTrajectory).',
        ],
        exercises: [
          {
            id: 'u2_n1_e1',
            type: 'architecture-tradeoff',
            prompt:
              'You are designing an API for a robotic arm to pick up a bin — an operation taking 8 seconds that must stream % progress and abort immediately if an obstacle appears. Which primitive?',
            options: [
              'A Service `/pick_bin`',
              'A Topic `/pick_bin_cmd`',
              'A ROS 2 Action `/pick_bin`',
              'A ROS 2 Parameter `target_bin`',
            ],
            correctIndex: 2,
            explanation:
              'Actions are built atop 3 services + 2 topics under the hood, providing Goal Acceptance, periodic Feedback, Result, and Cancellation/Preemption.',
          },
          {
            id: 'u2_n1_e2',
            type: 'multiple-choice',
            prompt:
              'Which 4 states are part of a ROS 2 Action goal’s terminal/active lifecycle?',
            options: [
              'ACCEPTED -> EXECUTING -> SUCCEEDED / ABORTED / CANCELED',
              'UNCONFIGURED -> INACTIVE -> ACTIVE -> FINALIZED',
              'INIT -> SPIN -> SHUTDOWN',
              'PENDING -> RUNNING -> KILLED',
            ],
            correctIndex: 0,
            explanation:
              'Action goals transition from ACCEPTED -> EXECUTING -> SUCCEEDED, ABORTED (server failed), or CANCELED (client requested cancel).',
          },
        ],
      },
      {
        id: 'u2_n2',
        unitId: 'unit_2',
        title: 'Managed Lifecycle Nodes',
        subtitle: 'Deterministic bringup & safe hardware teardown',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 70,
        linkedLabId: 'lab_lifecycle_node',
        keyTakeaways: [
          'LifecycleNodes expose a standard state machine: Unconfigured -> Inactive -> Active -> Finalized.',
          'Allocate memory/publishers in `on_configure`; enable timers/hardware in `on_activate`; stop motors in `on_deactivate`.',
          'Nav2’s `nav2_lifecycle_manager` orchestrates bringing up map_server, amcl, planner, and controller in exact dependency order.',
        ],
        exercises: [
          {
            id: 'u2_n2_e1',
            type: 'sequence-order',
            prompt:
              'Order the primary state machine transitions to bring a LifecycleNode from boot to publishing:',
            options: [
              'Unconfigured',
              'Configuring (on_configure)',
              'Inactive',
              'Activating (on_activate)',
              'Active',
            ],
            correctOrder: [
              'Unconfigured',
              'Configuring (on_configure)',
              'Inactive',
              'Activating (on_activate)',
              'Active',
            ],
            explanation:
              'Separating `configure` (allocate resources) from `activate` (start actuating/publishing) prevents race conditions during robot boot.',
          },
          {
            id: 'u2_n2_e2',
            type: 'multiple-choice',
            prompt:
              'What happens when you publish to a `LifecyclePublisher` while the node is in the `Inactive` state?',
            options: [
              'It throws a RuntimeError and crashes the node',
              'The message is silently suppressed until `on_activate()` is called',
              'It queues all messages and bursts them upon activation',
              'It forces the node into Active state automatically',
            ],
            correctIndex: 1,
            explanation:
              'LifecyclePublishers gate `publish()` calls based on activation state, making it safe for timers or hardware loops to run without leaking commands while inactive.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_3',
    number: 3,
    title: 'URDF, Xacro & TF2 Transforms',
    description:
      'Build kinematic robot descriptions, master REP-103 coordinate frames, and query TF2 without extrapolation errors.',
    color: 'violet',
    badgeName: 'TF2 Frame Master',
    nodes: [
      {
        id: 'u3_n1',
        unitId: 'unit_3',
        title: 'REP-103 & Coordinate Frames',
        subtitle: 'map -> odom -> base_link -> sensor_frame',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 55,
        linkedSimTab: 'tf2',
        keyTakeaways: [
          'REP-103 Right-Handed Rule: +X Forward, +Y Left, +Z Up (Red, Green, Blue in RViz).',
          'REP-105 Standard Tree: `map -> odom -> base_link`. Every frame has AT MOST ONE parent (tree, never a DAG/cycle).',
          '`odom -> base_link` is smooth & continuous (wheel odometry/IMU); `map -> odom` absorbs discrete SLAM/AMCL drift corrections.',
        ],
        exercises: [
          {
            id: 'u3_n1_e1',
            type: 'multiple-choice',
            prompt:
              'In a ROS 2 mobile robot following REP-105, which node publishes the `odom -> base_link` transform, and which publishes `map -> odom`?',
            options: [
              'AMCL publishes odom->base_link; wheel encoders publish map->odom',
              'Odometry / EKF publishes odom->base_link; SLAM / AMCL publishes map->odom',
              'robot_state_publisher publishes both',
              'static_transform_publisher publishes odom->base_link',
            ],
            correctIndex: 1,
            explanation:
              'Odometry/EKF tracks continuous local motion (`odom -> base_link`). Global localization (AMCL/SLAM) corrects global drift by updating `map -> odom` so `base_link` stays accurate in `map`.',
          },
          {
            id: 'u3_n1_e2',
            type: 'spot-the-bug',
            prompt:
              'Your robot model explodes in RViz and `tf2` logs "TF_SELF_TRANSFORM" or "multiple parents for base_link". Why?',
            options: [
              'Both wheel_odom and ekf_filter_node have publish_tf=true for odom->base_link',
              'robot_state_publisher is running too fast',
              'URDF uses meters instead of millimeters',
              'The LiDAR frame is fixed',
            ],
            correctIndex: 0,
            explanation:
              'A TF2 tree strictly allows one parent per frame and one authoritative broadcaster per edge. When fusing odom + IMU in `robot_localization`, disable `publish_tf` on raw wheel odometry!',
          },
        ],
      },
      {
        id: 'u3_n2',
        unitId: 'unit_3',
        title: 'URDF, Xacro & TF2 Time Travel',
        subtitle: 'Building robot descriptions & safe buffer lookups',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 70,
        linkedLabId: 'lab_tf2_lookup',
        keyTakeaways: [
          '`robot_state_publisher` reads `/robot_description` (URDF) + `/joint_states` to broadcast `/tf_static` (fixed joints) and `/tf` (revolute/prismatic joints).',
          'Use `rclpy.time.Time()` (time=0) for latest transform, or `Duration(seconds=0.1)` timeout in `lookup_transform` to wait for incoming transforms.',
          'Always use `use_sim_time: True` across ALL nodes when replaying bags or running Gazebo.',
        ],
        exercises: [
          {
            id: 'u3_n2_e1',
            type: 'multiple-choice',
            prompt:
              'Why does `tf_buffer.lookup_transform("map", "laser_frame", msg.header.stamp)` sometimes throw `ExtrapolationException: Lookup would require extrapolation into the future`?',
            options: [
              'The LiDAR driver clock is slightly ahead of the TF broadcaster, or TF hasn’t arrived yet for that timestamp',
              'The URDF has a syntax error',
              'TF2 only supports 2D transforms',
              'You forgot to install Gazebo',
            ],
            correctIndex: 0,
            explanation:
              'Sensor messages often arrive milliseconds before the corresponding `odom->base_link` TF at that exact stamp. Pass a small timeout (`timeout=Duration(seconds=0.1)`) or use `tf2_ros.MessageFilter`.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_4',
    number: 4,
    title: 'Control, Kinematics & State Estimation',
    description:
      'Tune PID loops with anti-windup, derive differential-drive odometry, and fuse IMU + wheel encoders with EKF.',
    color: 'amber',
    badgeName: 'Control & EKF Engineer',
    nodes: [
      {
        id: 'u4_n1',
        unitId: 'unit_4',
        title: 'PID Control & Anti-Windup Lab',
        subtitle: 'Tuning Kp, Ki, Kd and eliminating integral windup',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 60,
        linkedSimTab: 'pid',
        keyTakeaways: [
          'Proportional (Kp) drives responsiveness; too high causes oscillation.',
          'Integral (Ki) eliminates steady-state error (e.g., friction/gravity) but causes overshoot and "windup" when actuators saturate.',
          'Derivative (Kd) damps overshoot and acts like virtual viscosity, but amplifies high-frequency encoder/IMU noise (always low-pass filter D!).',
        ],
        exercises: [
          {
            id: 'u4_n1_e1',
            type: 'multiple-choice',
            prompt:
              'A robot arm gets stuck on an obstacle for 5 seconds while commanded to move. Once cleared, it violently overshoots the target. What is missing from the PID controller?',
            options: [
              'Higher Kp gain',
              'Integral anti-windup (clamping or back-calculation)',
              'Removing the Proportional term',
              'Switching from radians to degrees',
            ],
            correctIndex: 1,
            explanation:
              'While blocked, the error persists and the integral term accumulates to a huge value ("windup"). Clamping the integral term or pausing integration during actuator saturation prevents violent overshoot.',
          },
          {
            id: 'u4_n1_e2',
            type: 'multiple-choice',
            prompt:
              'Your velocity controller responds sluggishly and settles 8% below the target speed. What should you tune?',
            options: [
              'Increase Kd only',
              'Increase Kp and add a small Ki (or feedforward term)',
              'Decrease Kp to zero',
              'Invert the sign of Kd',
            ],
            correctIndex: 1,
            explanation:
              'A persistent steady-state offset is eliminated by Integral action (Ki) and/or a velocity feedforward term (Kff * target_vel).',
          },
        ],
      },
      {
        id: 'u4_n2',
        unitId: 'unit_4',
        title: 'Diff-Drive Kinematics & EKF Fusion',
        subtitle: 'Unicycle model, covariance matrices & robot_localization',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 60,
        keyTakeaways: [
          'Differential drive forward kinematics: v = (v_R + v_L)/2, ω = (v_R - v_L)/L (wheelbase).',
          'Wheel odometry drifts in heading (yaw) during turns/slip; IMUs measure angular velocity (ω_z) accurately over short horizons.',
          '`robot_localization` (`ekf_node`) fuses `/odom` (vx, vy) + `/imu/data` (yaw rate, orientation) using each sensor’s covariance matrix.',
        ],
        exercises: [
          {
            id: 'u4_n2_e1',
            type: 'architecture-tradeoff',
            prompt:
              'In `robot_localization` EKF config, both `/odom` and `/imu/data` provide yaw. Wheel slip causes `/odom` yaw to drift badly. How should you configure `odom0_config` and `imu0_config`?',
            options: [
              'Fuse absolute X, Y, and Yaw from both sensors simultaneously',
              'Fuse linear velocity (vx) from /odom, and angular velocity (vyaw) + orientation from /imu/data',
              'Disable /imu/data completely',
              'Set all covariances to 0.0',
            ],
            correctIndex: 1,
            explanation:
              'Fusing `vx` from wheel encoders with `vyaw` from the IMU avoids wheel-slip heading corruption. Never set covariance to 0.0 (it causes singular matrix inversion or over-trusting a noisy sensor).',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_5',
    number: 5,
    title: 'Perception, SLAM & Nav2',
    description:
      'Build 2D/3D maps with slam_toolbox, tune Nav2 costmaps, and orchestrate autonomous navigation with Behavior Trees.',
    color: 'rose',
    badgeName: 'Nav2 Navigator',
    nodes: [
      {
        id: 'u5_n1',
        unitId: 'unit_5',
        title: 'SLAM, Costmaps & Planners',
        subtitle: 'Global Smac/NavFn vs Local MPPI/DWB',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 75,
        linkedLabId: 'lab_nav2_yaml',
        keyTakeaways: [
          'Global Costmap (`map` frame) plans long-range paths; Local Costmap (`odom` frame, rolling window) avoids dynamic obstacles at 10–20 Hz.',
          'Inflation Layer adds exponential cost gradients around obstacles up to `inflation_radius` (> `robot_radius`).',
          'MPPI (Model Predictive Path Integral) samples thousands of trajectories in parallel on CPU/SIMD for smooth, non-holonomic control.',
        ],
        exercises: [
          {
            id: 'u5_n1_e1',
            type: 'multiple-choice',
            prompt:
              'Why does Nav2’s `local_costmap` use `global_frame: odom` instead of `map`?',
            options: [
              'odom is smaller in memory',
              'map frame can jump discretely during AMCL/SLAM corrections, which would destabilize high-rate local obstacle avoidance',
              'local_costmap does not support LaserScan in map frame',
              'odom is only used in Gazebo',
            ],
            correctIndex: 1,
            explanation:
              'Local controllers run at 10–30 Hz and require a smooth, continuous coordinate frame (`odom`) so sudden localization relocalizations don’t cause erratic steering.',
          },
          {
            id: 'u5_n1_e2',
            type: 'spot-the-bug',
            prompt:
              'Your robot hugs walls dangerously close and sometimes clips corners. Looking at `nav2_params.yaml`, what is wrong?',
            codeSnippet: `robot_radius: 0.35
inflation_layer:
  plugin: "nav2_costmap_2d::InflationLayer"
  cost_scaling_factor: 10.0
  inflation_radius: 0.25`,
            language: 'yaml',
            options: [
              'cost_scaling_factor must be negative',
              'inflation_radius (0.25) is smaller than robot_radius (0.35), so no lethal/inscribed buffer extends beyond the chassis',
              'InflationLayer only works in 3D',
              'robot_radius should be in millimeters',
            ],
            correctIndex: 1,
            explanation:
              '`inflation_radius` must be strictly greater than `robot_radius` (typically `robot_radius + 0.20m` or more) so the planner sees repulsive costs before collision.',
          },
        ],
      },
      {
        id: 'u5_n2',
        unitId: 'unit_5',
        title: 'Nav2 Behavior Trees',
        subtitle: 'Reactive recovery behaviors & BT.CPP orchestration',
        kind: 'lesson',
        estimatedMinutes: 8,
        xpReward: 55,
        keyTakeaways: [
          'Nav2 uses BehaviorTree.CPP (`bt_navigator`) to coordinate `ComputePathToPose`, `FollowPath`, and recovery nodes (`Spin`, `BackUp`, `ClearEntireCostmap`).',
          'Behavior Trees tick top-down and return `SUCCESS`, `FAILURE`, or `RUNNING` — much more modular than monolithic Finite State Machines.',
        ],
        exercises: [
          {
            id: 'u5_n2_e1',
            type: 'multiple-choice',
            prompt:
              'In a Behavior Tree, a `Fallback` (Selector) node ticks its children left-to-right. When does it return `SUCCESS`?',
            options: [
              'Only when ALL children return SUCCESS',
              'As soon as ANY child returns SUCCESS (used for trying primary behavior, then falling back to recovery)',
              'Never; Fallback nodes only return RUNNING',
              'When the first child returns FAILURE',
            ],
            correctIndex: 1,
            explanation:
              'Think of `Sequence` as logical AND (all must succeed) and `Fallback` as logical OR (try primary; if it fails, try recovery).',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_6',
    number: 6,
    title: 'Simulation, MoveIt 2 & Production',
    description:
      'Bridge Gazebo Sim with ros_gz, write ros2_control hardware interfaces, plan 6-DOF arm trajectories, and record deterministic rosbags.',
    color: 'cyan',
    badgeName: 'Principal Roboticist',
    nodes: [
      {
        id: 'u6_n1',
        unitId: 'unit_6',
        title: 'Gazebo Sim & ros2_control',
        subtitle: 'Sim-to-real parity with ros_gz_bridge & Controller Manager',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 65,
        keyTakeaways: [
          '`ros_gz_bridge` (`parameter_bridge`) translates Gazebo Transport topics (e.g., `/clock`, `/scan`, `/cmd_vel`) into ROS 2 topics.',
          '`ros2_control` decouples controllers (`diff_drive_controller`, `joint_trajectory_controller`) from hardware via `SystemInterface` plugins — swap `gz_ros2_control` for real EtherCAT/CAN hardware with zero controller code changes.',
        ],
        exercises: [
          {
            id: 'u6_n1_e1',
            type: 'multiple-choice',
            prompt:
              'Why is `ros2_control` considered essential for sim-to-real parity in production robotics?',
            options: [
              'It automatically trains reinforcement learning policies',
              'Controllers talk to abstract Command/State Interfaces, allowing the exact same controller YAML/code to run against Gazebo in CI and real actuators on the robot',
              'It replaces DDS with HTTP/REST',
              'It compiles Python to C++',
            ],
            correctIndex: 1,
            explanation:
              'Hardware abstraction via `hardware_interface::SystemInterface` means your `diff_drive_controller` or `joint_trajectory_controller` behaves identically in simulation and on physical hardware.',
          },
        ],
      },
      {
        id: 'u6_n2',
        unitId: 'unit_6',
        title: 'MoveIt 2, Rosbag2 & CI',
        subtitle: 'OMPL motion planning, MCAP bags & regression testing',
        kind: 'boss',
        estimatedMinutes: 10,
        xpReward: 100,
        keyTakeaways: [
          'MoveIt 2 uses `move_group` + OMPL/Pilz planners + `planning_scene` collision checking to generate collision-free `JointTrajectory` plans.',
          'ROS 2 Humble+ defaults to MCAP format for `ros2 bag record` — fast, self-contained (embeds message schemas), and ideal for Foxglove visualization & CI replay.',
        ],
        exercises: [
          {
            id: 'u6_n2_e1',
            type: 'multiple-choice',
            prompt:
              'Which rosbag2 storage format (default in ROS 2 Iron/Jazzy, supported in Humble) embeds `.msg` schemas inside the bag file so you can inspect it later even without the original custom message packages?',
            options: ['sqlite3 (.db3)', 'MCAP (.mcap)', 'CSV', 'JSONL'],
            correctIndex: 1,
            explanation:
              'MCAP is purpose-built for robotics logging: append-only, high-throughput, indexed, and self-describing with embedded message definitions.',
          },
          {
            id: 'u6_n2_e2',
            type: 'architecture-tradeoff',
            prompt:
              'When replaying a `ros2 bag play` recording to test your localization node offline, your node’s TF lookups fail with timestamp mismatches. What flag did you forget?',
            options: [
              '--clock on ros2 bag play AND use_sim_time:=true on your localization node',
              '--loop on ros2 bag play',
              'ROS_DOMAIN_ID=99',
              'QoS Durability = Volatile',
            ],
            correctIndex: 0,
            explanation:
              'Playing a bag with `--clock` publishes `/clock` at the recorded timestamps, and `use_sim_time:=true` tells nodes to use `/clock` instead of wall-clock system time.',
          },
        ],
      },
    ],
  },
];

export function getAllNodes() {
  return CURRICULUM_UNITS.flatMap((u) => u.nodes);
}
