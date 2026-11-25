import type { CodeLabTask } from '../types/curriculum';

export const CODE_LABS: CodeLabTask[] = [
  {
    id: 'lab_cpp_pub_sub',
    unitId: 'unit_1',
    title: 'C++ Sensor-Data QoS Watchdog & Safety Node',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    xpReward: 70,
    language: 'cpp',
    roboticsContext:
      'Real robots must stop immediately if a sensor stalls. You will subscribe to a high-rate LiDAR scan using SensorDataQoS and publish zero-velocity Twist commands if no scan arrives within 500 ms.',
    brief:
      'Implement an idiomatic C++ `rclcpp::Node` subclass (`LidarWatchdogNode`) that subscribes to `/scan` with `rclcpp::SensorDataQoS()`, publishes `/cmd_vel` (`geometry_msgs::msg::Twist`), and runs a 100 ms `create_wall_timer` watchdog.',
    requirements: [
      'Subclass `rclcpp::Node` with node name `"lidar_watchdog"`',
      'Subscribe to `"/scan"` (`sensor_msgs::msg::LaserScan`) using `rclcpp::SensorDataQoS()`',
      'Create a publisher on `"/cmd_vel"` (`geometry_msgs::msg::Twist`)',
      'Use `this->create_wall_timer(100ms, ...)` and `this->now()` to detect > 0.5s stale scans and publish zero `Twist`',
    ],
    starterCode: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/laser_scan.hpp"
#include "geometry_msgs/msg/twist.hpp"

using namespace std::chrono_literals;

class LidarWatchdogNode : public rclcpp::Node {
public:
  LidarWatchdogNode() : Node("lidar_watchdog"), last_scan_time_(this->now()) {
    // TODO: Create publisher on "/cmd_vel" (geometry_msgs::msg::Twist, queue 10)

    // TODO: Subscribe to "/scan" using rclcpp::SensorDataQoS()

    // TODO: Create 100ms wall timer calling watchdog_cb()
  }

private:
  void on_scan(sensor_msgs::msg::LaserScan::ConstSharedPtr /*msg*/) {
    last_scan_time_ = this->now();
  }

  void watchdog_cb() {
    auto elapsed = (this->now() - last_scan_time_).seconds();
    if (elapsed > 0.5) {
      geometry_msgs::msg::Twist stop_msg;
      // TODO: Publish zero Twist & log throttled warning
    }
  }

  rclcpp::Time last_scan_time_;
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_pub_;
  rclcpp::Subscription<sensor_msgs::msg::LaserScan>::SharedPtr scan_sub_;
  rclcpp::TimerBase::SharedPtr timer_;
};
`,
    solutionCode: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/laser_scan.hpp"
#include "geometry_msgs/msg/twist.hpp"

using namespace std::chrono_literals;

class LidarWatchdogNode : public rclcpp::Node {
public:
  LidarWatchdogNode() : Node("lidar_watchdog"), last_scan_time_(this->now()) {
    cmd_pub_ = this->create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);

    scan_sub_ = this->create_subscription<sensor_msgs::msg::LaserScan>(
      "/scan",
      rclcpp::SensorDataQoS(),
      std::bind(&LidarWatchdogNode::on_scan, this, std::placeholders::_1));

    timer_ = this->create_wall_timer(
      100ms, std::bind(&LidarWatchdogNode::watchdog_cb, this));
  }

private:
  void on_scan(sensor_msgs::msg::LaserScan::ConstSharedPtr /*msg*/) {
    last_scan_time_ = this->now();
  }

  void watchdog_cb() {
    auto elapsed = (this->now() - last_scan_time_).seconds();
    if (elapsed > 0.5) {
      geometry_msgs::msg::Twist stop_msg;
      cmd_pub_->publish(stop_msg);
      RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 1000,
        "LiDAR stale for %.2fs — commanding E-stop", elapsed);
    }
  }

  rclcpp::Time last_scan_time_;
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_pub_;
  rclcpp::Subscription<sensor_msgs::msg::LaserScan>::SharedPtr scan_sub_;
  rclcpp::TimerBase::SharedPtr timer_;
};
`,
    hints: [
      'Use `this->create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);`',
      'Pass `rclcpp::SensorDataQoS()` as the second argument to `create_subscription<sensor_msgs::msg::LaserScan>` so it matches real Best-Effort LiDAR drivers.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Creates Twist publisher on /cmd_vel',
        checkType: 'regex',
        patterns: ['create_publisher<geometry_msgs::msg::Twist>\\(\\s*"/cmd_vel"'],
      },
      {
        id: 't2',
        description: 'Subscribes to /scan with rclcpp::SensorDataQoS()',
        checkType: 'includes-all',
        patterns: ['create_subscription<sensor_msgs::msg::LaserScan>', '"/scan"', 'SensorDataQoS()'],
      },
      {
        id: 't3',
        description: 'Creates 100ms wall timer and publishes stop_msg',
        checkType: 'includes-all',
        patterns: ['create_wall_timer', '100ms', 'publish(stop_msg)'],
      },
    ],
  },
  {
    id: 'lab_cpp_executor_deadlock',
    unitId: 'unit_1',
    title: 'Fix C++ MultiThreadedExecutor & Reentrant CallbackGroup',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    xpReward: 85,
    language: 'cpp',
    roboticsContext:
      'Concurrency in ROS 2 C++ requires pairing CallbackGroups with a MultiThreadedExecutor. Without both, concurrent callbacks silently serialize and deadlock.',
    brief:
      'Fix this `rclcpp` node so its timer callback and service client run concurrently on a `MultiThreadedExecutor` using a `Reentrant` callback group.',
    requirements: [
      'Create `cb_group_ = this->create_callback_group(rclcpp::CallbackGroupType::Reentrant)`',
      'Pass `cb_group_` to `create_client(..., rmw_qos_profile_services_default, cb_group_)` and `create_wall_timer(..., cb_group_)`',
      'In `main()`, instantiate `rclcpp::executors::MultiThreadedExecutor`, call `executor.add_node(node)`, and `executor.spin()`',
    ],
    starterCode: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "std_srvs/srv/trigger.hpp"

using namespace std::chrono_literals;

class ConcurrentCaller : public rclcpp::Node {
public:
  ConcurrentCaller() : Node("concurrent_caller") {
    // TODO: Create Reentrant CallbackGroup

    // TODO: Attach cb_group_ to create_client and create_wall_timer
    client_ = this->create_client<std_srvs::srv::Trigger>("/calibrate");
    timer_ = this->create_wall_timer(1s, std::bind(&ConcurrentCaller::on_timer, this));
  }

private:
  void on_timer() {
    if (!client_->service_is_ready()) return;
    auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
    client_->async_send_request(req);
  }

  rclcpp::CallbackGroup::SharedPtr cb_group_;
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr client_;
  rclcpp::TimerBase::SharedPtr timer_;
};

int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<ConcurrentCaller>();
  // TODO: Replace rclcpp::spin(node) with MultiThreadedExecutor
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}
`,
    solutionCode: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "std_srvs/srv/trigger.hpp"

using namespace std::chrono_literals;

class ConcurrentCaller : public rclcpp::Node {
public:
  ConcurrentCaller() : Node("concurrent_caller") {
    cb_group_ = this->create_callback_group(rclcpp::CallbackGroupType::Reentrant);

    client_ = this->create_client<std_srvs::srv::Trigger>(
      "/calibrate", rmw_qos_profile_services_default, cb_group_);
    timer_ = this->create_wall_timer(
      1s, std::bind(&ConcurrentCaller::on_timer, this), cb_group_);
  }

private:
  void on_timer() {
    if (!client_->service_is_ready()) return;
    auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
    client_->async_send_request(req);
  }

  rclcpp::CallbackGroup::SharedPtr cb_group_;
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr client_;
  rclcpp::TimerBase::SharedPtr timer_;
};

int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<ConcurrentCaller>();
  rclcpp::executors::MultiThreadedExecutor executor;
  executor.add_node(node);
  executor.spin();
  rclcpp::shutdown();
  return 0;
}
`,
    hints: [
      '`rclcpp::CallbackGroupType::Reentrant` allows callbacks in the group to execute across worker threads simultaneously.',
      'In `main()`, replace `rclcpp::spin(node)` with `rclcpp::executors::MultiThreadedExecutor executor; executor.add_node(node); executor.spin();`.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Creates a Reentrant callback group',
        checkType: 'includes-all',
        patterns: ['create_callback_group', 'CallbackGroupType::Reentrant'],
      },
      {
        id: 't2',
        description: 'Passes callback group to create_client and create_wall_timer',
        checkType: 'regex',
        patterns: ['create_client<[^>]+>\\([^)]*cb_group_', 'create_wall_timer\\([^)]*cb_group_'],
      },
      {
        id: 't3',
        description: 'Spins using MultiThreadedExecutor',
        checkType: 'includes-all',
        patterns: ['MultiThreadedExecutor', 'add_node(node)', '.spin()'],
      },
    ],
  },
  {
    id: 'lab_cpp_lifecycle',
    unitId: 'unit_2',
    title: 'C++ Managed LifecycleNode (rclcpp_lifecycle)',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    xpReward: 90,
    language: 'cpp',
    roboticsContext:
      'Motor drivers must never leak commands during robot boot. LifecycleNodes separate configuration (resource allocation) from activation (actuation).',
    brief:
      'Implement `on_configure`, `on_activate`, and `on_deactivate` on a C++ `rclcpp_lifecycle::LifecycleNode` for a differential-drive motor controller.',
    requirements: [
      'Implement `on_configure`: allocate `cmd_pub_` via `create_publisher<geometry_msgs::msg::Twist>` and return `CallbackReturn::SUCCESS`',
      'Implement `on_activate`: call `LifecycleNode::on_activate(state)` (activates lifecycle publisher) and return `CallbackReturn::SUCCESS`',
      'Implement `on_deactivate`: call `LifecycleNode::on_deactivate(state)` and return `CallbackReturn::SUCCESS`',
    ],
    starterCode: `#include "rclcpp_lifecycle/lifecycle_node.hpp"
#include "geometry_msgs/msg/twist.hpp"

using CallbackReturn =
  rclcpp_lifecycle::node_interfaces::LifecycleNodeInterface::CallbackReturn;

class MotorDriverNode : public rclcpp_lifecycle::LifecycleNode {
public:
  explicit MotorDriverNode() : LifecycleNode("motor_driver") {}

  // TODO: Override on_configure(const rclcpp_lifecycle::State &)

  // TODO: Override on_activate(const rclcpp_lifecycle::State & state)

  // TODO: Override on_deactivate(const rclcpp_lifecycle::State & state)

private:
  rclcpp_lifecycle::LifecyclePublisher<geometry_msgs::msg::Twist>::SharedPtr cmd_pub_;
};
`,
    solutionCode: `#include "rclcpp_lifecycle/lifecycle_node.hpp"
#include "geometry_msgs/msg/twist.hpp"

using CallbackReturn =
  rclcpp_lifecycle::node_interfaces::LifecycleNodeInterface::CallbackReturn;

class MotorDriverNode : public rclcpp_lifecycle::LifecycleNode {
public:
  explicit MotorDriverNode() : LifecycleNode("motor_driver") {}

  CallbackReturn on_configure(const rclcpp_lifecycle::State &) override {
    cmd_pub_ = this->create_publisher<geometry_msgs::msg::Twist>("/motor_cmd", 10);
    return CallbackReturn::SUCCESS;
  }

  CallbackReturn on_activate(const rclcpp_lifecycle::State & state) override {
    LifecycleNode::on_activate(state);
    return CallbackReturn::SUCCESS;
  }

  CallbackReturn on_deactivate(const rclcpp_lifecycle::State & state) override {
    LifecycleNode::on_deactivate(state);
    return CallbackReturn::SUCCESS;
  }

private:
  rclcpp_lifecycle::LifecyclePublisher<geometry_msgs::msg::Twist>::SharedPtr cmd_pub_;
};
`,
    hints: [
      'Remember `override` on `on_configure`, `on_activate`, and `on_deactivate` so the compiler verifies exact signatures.',
      'Calling `LifecycleNode::on_activate(state)` automatically activates all `LifecyclePublisher`s owned by the node.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Overrides on_configure and allocates cmd_pub_',
        checkType: 'includes-all',
        patterns: ['on_configure(', 'create_publisher<geometry_msgs::msg::Twist>', 'CallbackReturn::SUCCESS'],
      },
      {
        id: 't2',
        description: 'Overrides on_activate and invokes base LifecycleNode::on_activate',
        checkType: 'includes-all',
        patterns: ['on_activate(', 'LifecycleNode::on_activate'],
      },
      {
        id: 't3',
        description: 'Overrides on_deactivate and invokes base LifecycleNode::on_deactivate',
        checkType: 'includes-all',
        patterns: ['on_deactivate(', 'LifecycleNode::on_deactivate'],
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
    roboticsContext:
      'Every physical sensor offset must be accurately captured in the URDF so TF2 and Nav2 know where laser hits sit relative to the robot wheels.',
    brief:
      'Complete the URDF/Xacro snippet to rigidly attach `laser_frame` 0.18 m forward (+X) and 0.22 m above (+Z) `base_link`, including collision and inertia blocks for Gazebo physics.',
    requirements: [
      'Add `<collision>` and `<inertial>` (`<mass value="..."/>` + `<inertia .../>`) to `<link name="laser_frame">`',
      'Define `<joint name="laser_joint" type="fixed">`',
      'Set `<parent link="base_link"/>` and `<child link="laser_frame"/>`',
      'Set `<origin xyz="0.18 0.0 0.22" rpy="0 0 0"/>`',
    ],
    starterCode: `<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="rover">
  <link name="base_link"/>

  <link name="laser_frame">
    <visual>
      <geometry><cylinder radius="0.04" length="0.05"/></geometry>
    </visual>
    <!-- TODO: Add <collision> and <inertial> blocks -->
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
      'In ROS REP-103: +X is forward, +Y is left, +Z is up.',
      'Physics simulators need `<mass>` and `<inertia>` to compute rigid-body dynamics cleanly.',
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
    id: 'lab_cpp_tf2_listener',
    unitId: 'unit_3',
    title: 'C++ TF2 Transform Listener & doTransform',
    difficulty: 'Advanced',
    estimatedMinutes: 12,
    xpReward: 85,
    language: 'cpp',
    roboticsContext:
      'Transforming a detected object from camera/laser coordinates into `base_link` or `map` coordinates is one of the most frequent C++ tasks in robotics.',
    brief:
      'Use `tf2_ros::Buffer` and `tf2_ros::TransformListener` in C++ to transform a `PointStamped` obstacle from `"laser_frame"` into `"base_link"`, catching `tf2::TransformException`.',
    requirements: [
      'Initialize `tf_buffer_` with `this->get_clock()` and `tf_listener_` with `*tf_buffer_`',
      'Call `tf_buffer_->lookupTransform("base_link", "laser_frame", tf2::TimePointZero)`',
      'Transform `pt_laser` into `pt_base` via `tf2::doTransform(pt_laser, pt_base, tf)` inside a `try / catch (const tf2::TransformException & ex)`',
    ],
    starterCode: `#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "tf2_ros/buffer.h"
#include "tf2_ros/transform_listener.h"
#include "tf2_geometry_msgs/tf2_geometry_msgs.hpp"
#include "geometry_msgs/msg/point_stamped.hpp"

class ObstacleProjector : public rclcpp::Node {
public:
  ObstacleProjector() : Node("obstacle_projector") {
    // TODO: Initialize tf_buffer_ and tf_listener_
  }

  void project_point(const geometry_msgs::msg::PointStamped & pt_laser) {
    // TODO: Lookup transform "base_link" <- "laser_frame" and call tf2::doTransform
  }

private:
  std::unique_ptr<tf2_ros::Buffer> tf_buffer_;
  std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
};
`,
    solutionCode: `#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "tf2_ros/buffer.h"
#include "tf2_ros/transform_listener.h"
#include "tf2_geometry_msgs/tf2_geometry_msgs.hpp"
#include "geometry_msgs/msg/point_stamped.hpp"

class ObstacleProjector : public rclcpp::Node {
public:
  ObstacleProjector() : Node("obstacle_projector") {
    tf_buffer_ = std::make_unique<tf2_ros::Buffer>(this->get_clock());
    tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);
  }

  void project_point(const geometry_msgs::msg::PointStamped & pt_laser) {
    try {
      auto tf = tf_buffer_->lookupTransform(
        "base_link", "laser_frame", tf2::TimePointZero);
      geometry_msgs::msg::PointStamped pt_base;
      tf2::doTransform(pt_laser, pt_base, tf);
      RCLCPP_INFO(this->get_logger(), "Obstacle in base_link: (%.2f, %.2f)",
        pt_base.point.x, pt_base.point.y);
    } catch (const tf2::TransformException & ex) {
      RCLCPP_WARN(this->get_logger(), "TF lookup failed: %s", ex.what());
    }
  }

private:
  std::unique_ptr<tf2_ros::Buffer> tf_buffer_;
  std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
};
`,
    hints: [
      'Notice the argument order of `lookupTransform(target_frame, source_frame, time)` — target (`"base_link"`) comes FIRST.',
      'Always wrap `lookupTransform` in `try { ... } catch (const tf2::TransformException & ex)`.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Initializes tf_buffer_ and tf_listener_',
        checkType: 'includes-all',
        patterns: ['std::make_unique<tf2_ros::Buffer>', 'TransformListener'],
      },
      {
        id: 't2',
        description: 'Looks up transform from laser_frame to base_link',
        checkType: 'regex',
        patterns: ['lookupTransform\\(\\s*"base_link"\\s*,\\s*"laser_frame"'],
      },
      {
        id: 't3',
        description: 'Calls tf2::doTransform inside TransformException try/catch',
        checkType: 'includes-all',
        patterns: ['tf2::doTransform', 'tf2::TransformException'],
      },
    ],
  },
  {
    id: 'lab_nav2_yaml',
    unitId: 'unit_5',
    title: 'Nav2 Costmap & Inflation Layer (YAML)',
    difficulty: 'Principal',
    estimatedMinutes: 10,
    xpReward: 90,
    language: 'yaml',
    roboticsContext:
      'Nav2 uses Configuration Space inflation so the planner treats a 0.70 m wide robot as a point without clipping walls.',
    brief:
      'Configure a Nav2 `local_costmap` with a rolling window in `odom` frame, `obstacle_layer`, and `inflation_layer` tuned for a 0.35 m radius robot.',
    requirements: [
      'Set `rolling_window: true` and `global_frame: odom` on `local_costmap`',
      'Set `robot_radius: 0.35`',
      'Include `"obstacle_layer"` and `"inflation_layer"` in `plugins`',
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
      '`inflation_radius` must be strictly larger than `robot_radius`.',
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
  {
    id: 'lab_cpp_bt_node',
    unitId: 'unit_5',
    title: 'BehaviorTree.CPP Custom C++ Condition Node',
    difficulty: 'Principal',
    estimatedMinutes: 12,
    xpReward: 95,
    language: 'cpp',
    roboticsContext:
      'Nav2 orchestrates autonomous missions via BehaviorTree.CPP. Custom C++ BT nodes read robot telemetry from the Blackboard and gate navigation cleanly.',
    brief:
      'Implement a `BT::ConditionNode` (`IsBatteryHealthy`) that reads `"min_pct"` from the BT input port via `getInput`, compares against `battery_pct_`, and returns `BT::NodeStatus::SUCCESS` or `FAILURE`.',
    requirements: [
      'Declare `static BT::PortsList providedPorts()` returning `BT::InputPort<double>("min_pct")`',
      'Override `BT::NodeStatus tick()`',
      'Read `"min_pct"` with `getInput("min_pct", min_pct)` and return `BT::NodeStatus::SUCCESS` or `BT::NodeStatus::FAILURE`',
    ],
    starterCode: `#include "behaviortree_cpp/condition_node.h"

class IsBatteryHealthy : public BT::ConditionNode {
public:
  IsBatteryHealthy(const std::string & name, const BT::NodeConfig & config)
  : BT::ConditionNode(name, config) {}

  // TODO: Implement static BT::PortsList providedPorts()

  // TODO: Override BT::NodeStatus tick()

private:
  double battery_pct_ = 45.0;
};
`,
    solutionCode: `#include "behaviortree_cpp/condition_node.h"

class IsBatteryHealthy : public BT::ConditionNode {
public:
  IsBatteryHealthy(const std::string & name, const BT::NodeConfig & config)
  : BT::ConditionNode(name, config) {}

  static BT::PortsList providedPorts() {
    return { BT::InputPort<double>("min_pct") };
  }

  BT::NodeStatus tick() override {
    double min_pct = 20.0;
    getInput("min_pct", min_pct);
    return (battery_pct_ >= min_pct)
      ? BT::NodeStatus::SUCCESS
      : BT::NodeStatus::FAILURE;
  }

private:
  double battery_pct_ = 45.0;
};
`,
    hints: [
      'BehaviorTree.CPP ports act like typed function parameters passed via XML attributes or Blackboard keys.',
      'Condition nodes never return `RUNNING` — only `SUCCESS` or `FAILURE`.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Defines static providedPorts() with InputPort<double>("min_pct")',
        checkType: 'includes-all',
        patterns: ['providedPorts()', 'BT::InputPort<double>("min_pct")'],
      },
      {
        id: 't2',
        description: 'Overrides tick() and reads port via getInput',
        checkType: 'includes-all',
        patterns: ['BT::NodeStatus tick()', 'getInput('],
      },
      {
        id: 't3',
        description: 'Returns BT::NodeStatus::SUCCESS and FAILURE',
        checkType: 'includes-all',
        patterns: ['BT::NodeStatus::SUCCESS', 'BT::NodeStatus::FAILURE'],
      },
    ],
  },
  {
    id: 'lab_py_launch_composition',
    unitId: 'unit_2',
    title: 'Python Launch File (.launch.py) + C++ Composable Container',
    difficulty: 'Intermediate',
    estimatedMinutes: 10,
    xpReward: 70,
    language: 'python',
    roboticsContext:
      'Even in C++-heavy ROS 2 stacks, bringup orchestration is almost always written in Python (`launch_ros`) to compose C++ nodes, pass YAML params, and set `use_sim_time`.',
    brief:
      'Write a ROS 2 Python launch file (`generate_launch_description`) that spins up a `ComposableNodeContainer` loading two C++ nodes (`camera_proc::Rectify` and `perception::ObstacleDetector`) with `use_intra_process_comms: True` for zero-copy IPC.',
    requirements: [
      'Define `def generate_launch_description():` returning a `LaunchDescription`',
      'Create a `ComposableNodeContainer` (`package="rclcpp_components"`, `executable="component_container_mt"`)',
      'Add two `ComposableNode` entries inside `composable_node_descriptions`',
      'Enable `extra_arguments=[{"use_intra_process_comms": True}]`',
    ],
    starterCode: `from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer
from launch_ros.descriptions import ComposableNode

def generate_launch_description():
    # TODO: Create ComposableNodeContainer named 'perception_container'
    # using package='rclcpp_components' and executable='component_container_mt'
    container = ComposableNodeContainer(
        name='perception_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        composable_node_descriptions=[
            # TODO: Add ComposableNode(s) with extra_arguments=[{'use_intra_process_comms': True}]
        ],
    )
    return LaunchDescription([container])
`,
    solutionCode: `from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer
from launch_ros.descriptions import ComposableNode

def generate_launch_description():
    container = ComposableNodeContainer(
        name='perception_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        composable_node_descriptions=[
            ComposableNode(
                package='camera_proc',
                plugin='camera_proc::Rectify',
                name='rectify_node',
                extra_arguments=[{'use_intra_process_comms': True}],
            ),
            ComposableNode(
                package='perception',
                plugin='perception::ObstacleDetector',
                name='obstacle_detector',
                extra_arguments=[{'use_intra_process_comms': True}],
            ),
        ],
    )
    return LaunchDescription([container])
`,
    hints: [
      '`component_container_mt` is the multi-threaded C++ component container.',
      'Pass `extra_arguments=[{"use_intra_process_comms": True}]` on each `ComposableNode` to enable zero-copy `std::unique_ptr` message passing.',
    ],
    tests: [
      {
        id: 't1',
        description: 'Defines generate_launch_description returning LaunchDescription',
        checkType: 'includes-all',
        patterns: ['def generate_launch_description()', 'LaunchDescription('],
      },
      {
        id: 't2',
        description: 'Configures ComposableNodeContainer with rclcpp_components',
        checkType: 'includes-all',
        patterns: ['ComposableNodeContainer', 'rclcpp_components'],
      },
      {
        id: 't3',
        description: 'Loads ComposableNode with use_intra_process_comms enabled',
        checkType: 'includes-all',
        patterns: ['ComposableNode(', 'use_intra_process_comms'],
      },
    ],
  },
];
