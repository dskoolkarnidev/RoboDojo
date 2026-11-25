import type { CodeLabTask } from '../types/curriculum';

export const CODE_LABS: CodeLabTask[] = [
  {
    id: 'lab_qos_sensor_node',
    unitId: 'unit_1',
    title: 'Sensor-Data QoS Publisher & Watchdog Node',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    xpReward: 60,
    language: 'python',
    brief:
      'Build an rclpy node that publishes high-frequency IMU data using SensorDataQoS (Best Effort, Volatile) and runs a 2 Hz watchdog timer that logs a warning if no command has been received recently.',
    requirements: [
      'Subclass `rclpy.node.Node` with node name `"imu_watchdog_node"`',
      'Import and configure `QoSProfile` with `ReliabilityPolicy.BEST_EFFORT` and `DurabilityPolicy.VOLATILE` (or `qos_profile_sensor_data`)',
      'Create a publisher on `"/imu/data"` using `Imu` message type',
      'Create a 0.5s timer (`create_timer(0.5, ...)`) that checks elapsed time via `self.get_clock().now()`',
    ],
    starterCode: `import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy
from sensor_msgs.msg import Imu

class ImuWatchdogNode(Node):
    def __init__(self):
        # TODO: Initialize node as 'imu_watchdog_node'
        pass

        # TODO: Define Best-Effort, Volatile QoS profile with depth=5
        sensor_qos = None

        # TODO: Create publisher on '/imu/data'
        self.imu_pub = None

        self.last_rx_time = self.get_clock().now()
        # TODO: Create 0.5s watchdog timer
        self.timer = None

    def watchdog_cb(self):
        elapsed = (self.get_clock().now() - self.last_rx_time).nanoseconds / 1e9
        if elapsed > 1.0:
            self.get_logger().warn(f'No IMU frames for {elapsed:.2f}s')
`,
    solutionCode: `import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy
from sensor_msgs.msg import Imu

class ImuWatchdogNode(Node):
    def __init__(self):
        super().__init__('imu_watchdog_node')

        sensor_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            depth=5
        )

        self.imu_pub = self.create_publisher(Imu, '/imu/data', sensor_qos)
        self.last_rx_time = self.get_clock().now()
        self.timer = self.create_timer(0.5, self.watchdog_cb)

    def watchdog_cb(self):
        elapsed = (self.get_clock().now() - self.last_rx_time).nanoseconds / 1e9
        if elapsed > 1.0:
            self.get_logger().warn(f'No IMU frames for {elapsed:.2f}s')
`,
    hints: [
      'Always call `super().__init__("imu_watchdog_node")` first so `self.get_clock()` and `self.create_publisher()` are initialized.',
      'Pass `sensor_qos` as the 3rd argument to `self.create_publisher(Imu, "/imu/data", sensor_qos)`.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Calls super().__init__ with node name imu_watchdog_node',
        checkType: 'regex',
        patterns: ['super\\(\\)\\.__init__\\([\'\"]imu_watchdog_node[\'\"]\\)'],
      },
      {
        id: 't2',
        description: 'Configures BEST_EFFORT and VOLATILE QoS (or qos_profile_sensor_data)',
        checkType: 'includes-any',
        patterns: ['BEST_EFFORT', 'qos_profile_sensor_data'],
      },
      {
        id: 't3',
        description: 'Creates publisher on /imu/data with Imu message',
        checkType: 'regex',
        patterns: ['create_publisher\\(\\s*Imu\\s*,\\s*[\'\"]/imu/data[\'\"]'],
      },
      {
        id: 't4',
        description: 'Creates 0.5s timer bound to watchdog_cb',
        checkType: 'regex',
        patterns: ['create_timer\\(\\s*0\\.5\\s*,\\s*self\\.watchdog_cb'],
      },
    ],
  },
  {
    id: 'lab_reentrant_executor',
    unitId: 'unit_1',
    title: 'Deadlock-Free Callback Groups & MultiThreadedExecutor',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    xpReward: 80,
    language: 'python',
    brief:
      'A classic ROS 2 production bug: a timer callback calls a service synchronously (or awaits a future) while sharing the default MutuallyExclusiveCallbackGroup, deadlocking the executor! Fix the node using ReentrantCallbackGroup and MultiThreadedExecutor.',
    requirements: [
      'Import `ReentrantCallbackGroup` from `rclpy.callback_groups` and `MultiThreadedExecutor` from `rclpy.executors`',
      'Assign `self.cb_group = ReentrantCallbackGroup()` to both the service client and the timer',
      'Spin the node using `MultiThreadedExecutor(num_threads=2)` or higher',
    ],
    starterCode: `import rclpy
from rclpy.node import Node
from std_srvs.srv import Trigger
# TODO: Import ReentrantCallbackGroup and MultiThreadedExecutor

class SafeServiceCaller(Node):
    def __init__(self):
        super().__init__('safe_service_caller')
        # TODO: Create a ReentrantCallbackGroup
        self.cb_group = None

        # TODO: Pass callback_group=self.cb_group to create_client & create_timer
        self.cli = self.create_client(Trigger, '/calibrate_lidar')
        self.timer = self.create_timer(2.0, self.timer_cb)

    def timer_cb(self):
        if not self.cli.service_is_ready():
            return
        req = Trigger.Request()
        future = self.cli.call_async(req)
        # In a ReentrantCallbackGroup + MultiThreadedExecutor, waiting won't starve the response!

def main():
    rclpy.init()
    node = SafeServiceCaller()
    # TODO: Use MultiThreadedExecutor to spin the node
    rclpy.spin(node)
    rclpy.shutdown()
`,
    solutionCode: `import rclpy
from rclpy.node import Node
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from std_srvs.srv import Trigger

class SafeServiceCaller(Node):
    def __init__(self):
        super().__init__('safe_service_caller')
        self.cb_group = ReentrantCallbackGroup()

        self.cli = self.create_client(
            Trigger, '/calibrate_lidar', callback_group=self.cb_group
        )
        self.timer = self.create_timer(
            2.0, self.timer_cb, callback_group=self.cb_group
        )

    def timer_cb(self):
        if not self.cli.service_is_ready():
            return
        req = Trigger.Request()
        future = self.cli.call_async(req)

def main():
    rclpy.init()
    node = SafeServiceCaller()
    executor = MultiThreadedExecutor(num_threads=2)
    executor.add_node(node)
    try:
        executor.spin()
    finally:
        node.destroy_node()
        rclpy.shutdown()
`,
    hints: [
      'A `SingleThreadedExecutor` ignores `ReentrantCallbackGroup` parallelism — you MUST pair it with `MultiThreadedExecutor`.',
      'Even better in production: use `future.add_done_callback(...)` instead of blocking inside `timer_cb`, or use `ReentrantCallbackGroup` when awaiting.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Imports ReentrantCallbackGroup',
        checkType: 'includes-all',
        patterns: ['ReentrantCallbackGroup'],
      },
      {
        id: 't2',
        description: 'Assigns callback_group to both create_client and create_timer',
        checkType: 'regex',
        patterns: ['create_client\\([^)]*callback_group', 'create_timer\\([^)]*callback_group'],
      },
      {
        id: 't3',
        description: 'Spins with MultiThreadedExecutor',
        checkType: 'includes-all',
        patterns: ['MultiThreadedExecutor', 'add_node', '.spin()'],
      },
    ],
  },
  {
    id: 'lab_lifecycle_node',
    unitId: 'unit_2',
    title: 'Managed Lifecycle Node (on_configure / on_activate)',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    xpReward: 85,
    language: 'python',
    brief:
      'Implement a ROS 2 LifecycleNode for a motor driver. Hardware resources and publishers must be allocated in `on_configure`, enabled in `on_activate`, and safely torn down in `on_deactivate` / `on_cleanup`.',
    requirements: [
      'Inherit from `rclpy.lifecycle.Node` (or `LifecycleNode`) and import `TransitionCallbackReturn`',
      'Implement `on_configure(self, state)` creating a lifecycle publisher and returning `TransitionCallbackReturn.SUCCESS`',
      'Implement `on_activate(self, state)` calling `super().on_activate(state)`',
      'Implement `on_deactivate(self, state)` calling `super().on_deactivate(state)`',
    ],
    starterCode: `import rclpy
from rclpy.lifecycle import Node as LifecycleNode
from rclpy.lifecycle import State, TransitionCallbackReturn
from geometry_msgs.msg import Twist

class MotorDriverLifecycle(LifecycleNode):
    def __init__(self):
        super().__init__('motor_driver')
        self.cmd_pub = None

    # TODO: Implement on_configure(self, state: State) -> TransitionCallbackReturn

    # TODO: Implement on_activate(self, state: State) -> TransitionCallbackReturn

    # TODO: Implement on_deactivate(self, state: State) -> TransitionCallbackReturn
`,
    solutionCode: `import rclpy
from rclpy.lifecycle import Node as LifecycleNode
from rclpy.lifecycle import State, TransitionCallbackReturn
from geometry_msgs.msg import Twist

class MotorDriverLifecycle(LifecycleNode):
    def __init__(self):
        super().__init__('motor_driver')
        self.cmd_pub = None

    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self.cmd_pub = self.create_lifecycle_publisher(Twist, '/cmd_vel_out', 10)
        self.get_logger().info('Motor driver configured')
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Motor driver activated')
        return super().on_activate(state)

    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self.get_logger().info('Motor driver deactivated')
        return super().on_deactivate(state)
`,
    hints: [
      'Use `self.create_lifecycle_publisher(...)` so messages are automatically gated when the node is not in the Active state.',
      '`super().on_activate(state)` activates all registered lifecycle publishers and returns `TransitionCallbackReturn.SUCCESS`.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Defines on_configure and creates lifecycle publisher',
        checkType: 'includes-all',
        patterns: ['def on_configure', 'create_lifecycle_publisher', 'TransitionCallbackReturn.SUCCESS'],
      },
      {
        id: 't2',
        description: 'Defines on_activate and delegates to super().on_activate',
        checkType: 'includes-all',
        patterns: ['def on_activate', 'super().on_activate'],
      },
      {
        id: 't3',
        description: 'Defines on_deactivate and delegates to super().on_deactivate',
        checkType: 'includes-all',
        patterns: ['def on_deactivate', 'super().on_deactivate'],
      },
    ],
  },
  {
    id: 'lab_urdf_lidar',
    unitId: 'unit_3',
    title: 'URDF / Xacro: Mounting a 2D LiDAR on base_link',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    xpReward: 65,
    language: 'xml',
    brief:
      'Complete the URDF/Xacro snippet to rigidly attach a `laser_frame` link 0.18m forward (X) and 0.22m above (Z) `base_link`, with proper inertial and collision geometry for Gazebo simulation.',
    requirements: [
      'Define `<link name="laser_frame">` with `<visual>`, `<collision>`, and `<inertial>` blocks',
      'Define `<joint name="laser_joint" type="fixed">`',
      'Set `<parent link="base_link"/>` and `<child link="laser_frame"/>`',
      'Set `<origin xyz="0.18 0.0 0.22" rpy="0 0 0"/>`',
    ],
    starterCode: `<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="rover">
  <link name="base_link"/>

  <!-- TODO: Add laser_frame link with visual, collision, and inertial -->
  <link name="laser_frame">
    <visual>
      <geometry><cylinder radius="0.04" length="0.05"/></geometry>
    </visual>
  </link>

  <!-- TODO: Add fixed joint 'laser_joint' from base_link to laser_frame at xyz="0.18 0.0 0.22" -->
</robot>
`,
    solutionCode: `<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="rover">
  <link name="base_link"/>

  <link name="laser_frame">
    <visual>
      <geometry><cylinder radius="0.04" length="0.05"/></geometry>
    </visual>
    <collision>
      <geometry><cylinder radius="0.04" length="0.05"/></geometry>
    </collision>
    <inertial>
      <mass value="0.25"/>
      <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0002"/>
    </inertial>
  </link>

  <joint name="laser_joint" type="fixed">
    <parent link="base_link"/>
    <child link="laser_frame"/>
    <origin xyz="0.18 0.0 0.22" rpy="0 0 0"/>
  </joint>
</robot>
`,
    hints: [
      'Gazebo/physics engines ignore links without `<inertial>` or merge fixed-joint links; adding `<collision>` and `<inertial>` prevents silent physics bugs.',
      'In ROS REP-103: +X is forward, +Y is left, +Z is up.',
    ],
    tests: [
      {
        id: 't1',
        description: 'laser_frame includes collision and inertial blocks',
        checkType: 'includes-all',
        patterns: ['<collision>', '<inertial>', '<mass'],
      },
      {
        id: 't2',
        description: 'Defines fixed joint laser_joint',
        checkType: 'regex',
        patterns: ['<joint\\s+name=[\'\"]laser_joint[\'\"]\\s+type=[\'\"]fixed[\'\"]'],
      },
      {
        id: 't3',
        description: 'Connects base_link -> laser_frame at xyz="0.18 0.0 0.22"',
        checkType: 'includes-all',
        patterns: ['<parent link="base_link"', '<child link="laser_frame"', '0.18 0.0 0.22'],
      },
    ],
  },
  {
    id: 'lab_tf2_lookup',
    unitId: 'unit_3',
    title: 'TF2 Transform Lookup with Extrapolation Guard',
    difficulty: 'Advanced',
    estimatedMinutes: 10,
    xpReward: 75,
    language: 'python',
    brief:
      'Query the transform from `map` to `base_link` using `tf2_ros.Buffer` and `TransformListener`, handling `LookupException`, `ConnectivityException`, and `ExtrapolationException` cleanly.',
    requirements: [
      'Instantiate `Buffer()` and `TransformListener(self.tf_buffer, self)`',
      'Call `self.tf_buffer.lookup_transform("map", "base_link", rclpy.time.Time())`',
      'Catch `tf2_ros.TransformException` (or specific TF2 exceptions) so transient startup misses do not crash the node',
    ],
    starterCode: `import rclpy
from rclpy.node import Node
import tf2_ros

class PoseTracker(Node):
    def __init__(self):
        super().__init__('pose_tracker')
        # TODO: Initialize tf_buffer and tf_listener
        self.tf_buffer = None
        self.tf_listener = None
        self.timer = self.create_timer(0.1, self.on_timer)

    def on_timer(self):
        # TODO: Safely lookup transform from 'map' to 'base_link' at latest available time
        pass
`,
    solutionCode: `import rclpy
from rclpy.node import Node
import tf2_ros

class PoseTracker(Node):
    def __init__(self):
        super().__init__('pose_tracker')
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        self.timer = self.create_timer(0.1, self.on_timer)

    def on_timer(self):
        try:
            t = self.tf_buffer.lookup_transform(
                'map',
                'base_link',
                rclpy.time.Time()
            )
            x = t.transform.translation.x
            y = t.transform.translation.y
            self.get_logger().debug(f'Robot at ({x:.2f}, {y:.2f})')
        except tf2_ros.TransformException as ex:
            self.get_logger().warn(f'TF lookup failed: {ex}')
`,
    hints: [
      'Passing `rclpy.time.Time()` (time=0) asks TF2 for the latest available transform instead of the exact current nanosecond.',
      'Keep `self.tf_listener` stored as an instance attribute (`self.tf_listener`) so Python garbage collection does not destroy the `/tf` subscription!',
    ],
    tests: [
      {
        id: 't1',
        description: 'Creates tf2_ros.Buffer and TransformListener',
        checkType: 'includes-all',
        patterns: ['tf2_ros.Buffer()', 'TransformListener('],
      },
      {
        id: 't2',
        description: 'Calls lookup_transform for map and base_link',
        checkType: 'regex',
        patterns: ['lookup_transform\\(\\s*[\'\"]map[\'\"]\\s*,\\s*[\'\"]base_link[\'\"]'],
      },
      {
        id: 't3',
        description: 'Handles TransformException gracefully',
        checkType: 'includes-any',
        patterns: ['TransformException', 'ExtrapolationException', 'LookupException'],
      },
    ],
  },
  {
    id: 'lab_nav2_yaml',
    unitId: 'unit_5',
    title: 'Nav2 Costmap & MPPI Controller Tuning (YAML)',
    difficulty: 'Principal',
    estimatedMinutes: 12,
    xpReward: 95,
    language: 'yaml',
    brief:
      'Configure a Nav2 `local_costmap` with a rolling window, `voxel_layer` / `obstacle_layer`, and `inflation_layer` tuned for a 0.35m-radius differential-drive robot.',
    requirements: [
      'Set `rolling_window: true` and `global_frame: odom` on `local_costmap`',
      'Set `robot_radius: 0.35`',
      'Include both `"obstacle_layer"` and `"inflation_layer"` in `plugins`',
      'Set `inflation_radius` > `robot_radius` (e.g., `0.55`)',
    ],
    starterCode: `local_costmap:
  local_costmap:
    ros__parameters:
      update_frequency: 5.0
      publish_frequency: 2.0
      # TODO: Set global_frame, rolling_window, width, height, resolution, robot_radius
      # TODO: Configure plugins: ["obstacle_layer", "inflation_layer"]
`,
    solutionCode: `local_costmap:
  local_costmap:
    ros__parameters:
      update_frequency: 5.0
      publish_frequency: 2.0
      global_frame: odom
      robot_base_frame: base_link
      rolling_window: true
      width: 3
      height: 3
      resolution: 0.05
      robot_radius: 0.35
      plugins: ["obstacle_layer", "inflation_layer"]
      obstacle_layer:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        enabled: true
        observation_sources: scan
        scan:
          topic: /scan
          max_obstacle_height: 2.0
          clearing: true
          marking: true
          data_type: "LaserScan"
      inflation_layer:
        plugin: "nav2_costmap_2d::InflationLayer"
        cost_scaling_factor: 3.0
        inflation_radius: 0.55
`,
    hints: [
      'Local costmap always uses `odom` (smooth, continuous) rather than `map` (which can jump on AMCL/SLAM loop closures).',
      '`inflation_radius` must be strictly larger than `robot_radius` so the planner sees a gradient around obstacles.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Sets global_frame: odom and rolling_window: true',
        checkType: 'includes-all',
        patterns: ['global_frame: odom', 'rolling_window: true'],
      },
      {
        id: 't2',
        description: 'Configures robot_radius: 0.35',
        checkType: 'includes-all',
        patterns: ['robot_radius: 0.35'],
      },
      {
        id: 't3',
        description: 'Enables obstacle_layer and inflation_layer plugins',
        checkType: 'includes-all',
        patterns: ['obstacle_layer', 'inflation_layer', 'inflation_radius:'],
      },
    ],
  },
];
