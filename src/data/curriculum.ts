import type { Unit } from '../types/curriculum';

export const CURRICULUM_UNITS: Unit[] = [
  {
    id: 'unit_1',
    number: 1,
    title: 'Robotics First Principles & ROS 2 C++ Core',
    description:
      'Bridge from C++ systems engineering to physical robotics: control loops, ament_cmake/colcon, DDS QoS, and lock-free rclcpp executors.',
    color: 'emerald',
    badgeName: 'rclcpp Systems Architect',
    nodes: [
      {
        id: 'u1_n1',
        unitId: 'unit_1',
        title: 'Sense → Plan → Act & Multi-Rate Loops',
        subtitle: 'What makes physical robotics fundamentally different from backend C++',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 45,
        linkedSimTab: 'diffdrive',
        keyTakeaways: [
          'Every robot runs a continuous Sense → Plan → Act feedback loop against noisy, non-deterministic physical reality.',
          'Subsystems run at vastly different frequencies: Motor torque PID (1000 Hz) > State Estimation/EKF (100 Hz) > Local Obstacle Avoidance (20 Hz) > Global Path Planning (1 Hz).',
          'ROS 2 is NOT an OS kernel — it is a distributed C++/Python middleware & robotics standard library layered over DDS.',
        ],
        deepDive: [
          {
            title: '1. From Request/Response Software to Closed-Loop Physics',
            body: 'In backend C++ services, an RPC arrives, mutates state, and returns. In robotics, the world changes continuously even when your code is idle. Wheels slip on dust, battery voltage sags, and LiDAR beams miss dark glass. Therefore, robots rely on closed-loop feedback: sensors continuously measure actual state, planners compute desired state, and controllers output actuator commands to shrink the error.',
            cppBridge:
              'Think of a robot like a game engine + real-time telemetry pipeline: physics never pauses for a slow mutex or garbage collection pause.',
          },
          {
            title: '2. Multi-Rate Hierarchical Control Loops',
            body: 'You never run A* path planning at 1 kHz, and you never run wheel velocity PID at 1 Hz. Robotics architectures decouple rates into layers: Inner Hardware Loop (500–1000 Hz, deterministic C++), State Estimation & Odometry (50–200 Hz), Local Trajectory Control (10–30 Hz), and Global Mission Planning (0.5–2 Hz or event-driven).',
            code: `// Typical multi-rate C++ robotics stack timing budget:
// [1000 Hz | 1.0 ms budget] -> ros2_control Motor PID (PREEMPT_RT, zero heap alloc)
// [ 100 Hz | 10 ms budget]  -> EKF State Estimator (IMU + Wheel Encoders)
// [  20 Hz | 50 ms budget]  -> Nav2 MPPI Local Controller + Costmap
// [   1 Hz | 1000 ms]       -> Nav2 Smac Global A* Planner + Behavior Tree`,
            language: 'cpp',
          },
          {
            title: '3. Why ROS 2 Exists (and Why It Replaced ROS 1)',
            body: 'ROS 2 provides three pillars: (1) Standardized message contracts (geometry_msgs/Twist, sensor_msgs/LaserScan, nav_msgs/Odometry) so drivers, planners, and visualizers interoperate; (2) Decentralized DDS transport (no single point of failure like ROS 1 roscore); and (3) Production tooling (colcon, RViz2, Gazebo, TF2, Nav2, MoveIt 2).',
          },
        ],
        exercises: [
          {
            id: 'u1_n1_e1',
            type: 'multiple-choice',
            prompt:
              'In an autonomous mobile robot, why is motor current/velocity PID run at ~1000 Hz while global path planning runs at ~1 Hz?',
            options: [
              'Global planners are always written in Python, which cannot run faster than 1 Hz',
              'Actuator dynamics change in milliseconds and require tight feedback stability, whereas global route topology changes slowly and is computationally expensive',
              'DDS limits topics to 1 Hz unless they use Twist messages',
              'Wheel encoders only update once per second',
            ],
            correctIndex: 1,
            explanation:
              'Physical stability depends on sampling much faster than the mechanical time constant. Motor torque/velocity needs sub-millisecond to few-millisecond loops, while searching a 2D map graph takes tens of milliseconds and only needs to re-plan periodically.',
            seniorTip:
              'Never put heavy heap allocations, blocking I/O, or path searches on the same thread/timer as your low-level actuator control loop.',
          },
          {
            id: 'u1_n1_e2',
            type: 'architecture-tradeoff',
            prompt:
              'Your differential-drive robot commands a wheel velocity of 0.5 m/s open-loop (without encoder feedback). On carpet vs tile, what happens?',
            options: [
              'It drives at exactly 0.5 m/s on both surfaces because voltage is constant',
              'Higher rolling resistance on carpet slows the robot down and causes heading drift because open-loop control cannot observe or correct physical error',
              'Open-loop control automatically compensates using DDS QoS',
              'The robot moves faster on carpet due to extra traction',
            ],
            correctIndex: 1,
            explanation:
              'Open-loop control blindly applies voltage/PWM without measuring output. Closed-loop feedback (reading wheel encoders -> PID) measures actual wheel speed and increases torque on carpet to maintain 0.5 m/s.',
          },
          {
            id: 'u1_n1_e3',
            type: 'sequence-order',
            prompt:
              'Order the Sense → Plan → Act pipeline for one autonomous navigation cycle (top = first):',
            options: [
              'Sensors (LiDAR, IMU, Encoders) publish raw physical measurements',
              'State Estimator (EKF) & SLAM fuse measurements into robot pose',
              'Planner & Controller compute obstacle-free velocity Twist (v, ω)',
              'ros2_control converts Twist into left/right wheel motor commands',
            ],
            correctOrder: [
              'Sensors (LiDAR, IMU, Encoders) publish raw physical measurements',
              'State Estimator (EKF) & SLAM fuse measurements into robot pose',
              'Planner & Controller compute obstacle-free velocity Twist (v, ω)',
              'ros2_control converts Twist into left/right wheel motor commands',
            ],
            explanation:
              'Every autonomous robot flows from raw physical sensing -> state estimation -> planning/control -> hardware actuation.',
          },
        ],
      },
      {
        id: 'u1_n2',
        unitId: 'unit_1',
        title: 'ament_cmake, colcon & Your First rclcpp Node',
        subtitle: 'ROS 2 C++ workspace anatomy, smart pointers, and wall timers',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 65,
        linkedLabId: 'lab_cpp_pub_sub',
        keyTakeaways: [
          'A ROS 2 workspace uses `colcon build --symlink-install` to compile packages defined by `package.xml` (dependencies/metadata) and `CMakeLists.txt` (`ament_cmake`).',
          'Modern `rclcpp` nodes inherit from `rclcpp::Node` and are always instantiated as `std::shared_ptr<MyNode>` via `std::make_shared`.',
          'Use C++14/17 `std::chrono_literals` (`50ms`, `500ms`) with `create_wall_timer` and `RCLCPP_INFO` / `RCLCPP_WARN_THROTTLE` for logging.',
        ],
        deepDive: [
          {
            title: '1. ROS 2 C++ Package Anatomy (The Construct Pattern)',
            body: 'Unlike a standalone CMake project, every ROS 2 C++ package contains two mandatory metadata/build files: `package.xml` (declares `buildtool_depend` on `ament_cmake` and `depend` tags like `rclcpp`, `geometry_msgs` so `rosdep` can install apt dependencies) and `CMakeLists.txt` (uses `find_package()`, `ament_target_dependencies()`, and `install(TARGETS ... DESTINATION lib/${PROJECT_NAME})` so `ros2 run` can locate the binary).',
            code: `cmake_minimum_required(VERSION 3.16)
project(rover_control)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)

add_executable(velocity_node src/velocity_node.cpp)
ament_target_dependencies(velocity_node rclcpp geometry_msgs)

install(TARGETS velocity_node DESTINATION lib/\${PROJECT_NAME})
ament_package()`,
            language: 'cmake',
          },
          {
            title: '2. Anatomy of an Idiomatic Modern C++ rclcpp::Node',
            body: 'In `rclcpp`, your class subclasses `rclcpp::Node`. Always pass `rclcpp::Node` as a `std::shared_ptr` into `rclcpp::spin(node)` — internally `rclcpp` calls `shared_from_this()` when registering timers, publishers, and TF listeners, which throws `std::bad_weak_ptr` if constructed on the stack!',
            cppBridge:
              'Never instantiate an `rclcpp::Node` subclass as a stack value (`MyNode node;`); always use `std::make_shared<MyNode>()` just like `std::enable_shared_from_this` objects in Boost.Asio.',
            code: `#include <chrono>
#include <memory>
#include "rclcpp/rclcpp.hpp"
#include "geometry_msgs/msg/twist.hpp"

using namespace std::chrono_literals;

class SafetyStopNode : public rclcpp::Node {
public:
  SafetyStopNode() : Node("safety_stop_node") {
    pub_ = this->create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);
    timer_ = this->create_wall_timer(
      50ms, std::bind(&SafetyStopNode::on_timer, this));
  }
private:
  void on_timer() {
    geometry_msgs::msg::Twist msg;
    msg.linear.x = 0.0;
    pub_->publish(msg);
  }
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr pub_;
  rclcpp::TimerBase::SharedPtr timer_;
};`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u1_n2_e1',
            type: 'spot-the-bug',
            prompt:
              'Why does `colcon build` succeed, yet `ros2 run my_pkg my_node` fails with "No executable found"?',
            codeSnippet: `add_executable(my_node src/my_node.cpp)
ament_target_dependencies(my_node rclcpp)
ament_package()`,
            language: 'cmake',
            options: [
              'rclcpp cannot be linked in CMakeLists.txt',
              'Missing `install(TARGETS my_node DESTINATION lib/${PROJECT_NAME})` before `ament_package()`',
              'Missing `ros2_run_enable()` macro',
              'The file must be named main.cpp',
            ],
            correctIndex: 1,
            explanation:
              '`ros2 run` looks inside `install/<pkg>/lib/<pkg>/`. Without `install(TARGETS ... DESTINATION lib/${PROJECT_NAME})`, the binary stays in `build/` and is never installed.',
          },
          {
            id: 'u1_n2_e2',
            type: 'spot-the-bug',
            prompt:
              'What happens at runtime if you construct a `rclcpp::Node` subclass on the stack and pass `&node` or try `shared_from_this()`?',
            codeSnippet: `int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  MyRobotNode node; // <-- stack allocated!
  // ...
}`,
            language: 'cpp',
            options: [
              'It compiles and runs faster due to stack allocation',
              'Passing `node.get_node_base_interface()` or calling `shared_from_this()` throws `std::bad_weak_ptr` because `rclcpp::Node` inherits `std::enable_shared_from_this`',
              'DDS rejects stack memory addresses',
              'CMake refuses to link stack-allocated nodes',
            ],
            correctIndex: 1,
            explanation:
              '`rclcpp::Node` inherits from `std::enable_shared_from_this<Node>`. Always allocate via `auto node = std::make_shared<MyRobotNode>();` and pass it to `rclcpp::spin(node);`.',
          },
          {
            id: 'u1_n2_e3',
            type: 'code-fill',
            prompt:
              'Complete the `CMakeLists.txt` line to install your C++ node binary so `ros2 run` can launch it:',
            language: 'cmake',
            codeSnippet: `install(TARGETS lidar_filter
  DESTINATION ____/\${PROJECT_NAME}
)`,
            options: ['lib', 'bin', 'share', 'include'],
            correctIndex: 0,
            explanation:
              'ROS 2 convention places package executables in `lib/${PROJECT_NAME}` (not `bin/`) to keep package binaries namespaced by package name.',
          },
        ],
      },
      {
        id: 'u1_n3',
        unitId: 'unit_1',
        title: 'DDS Discovery & QoS Compatibility',
        subtitle: 'Under-the-hood RTPS transport & why topics silently drop',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 55,
        linkedSimTab: 'qos',
        keyTakeaways: [
          'ROS 2 abstracts vendor DDS implementations (FastDDS, CycloneDDS) behind `rmw` (ROS Middleware Interface).',
          'RxO (Request vs Offered): A subscriber cannot require stronger QoS guarantees than the publisher offers.',
          'Use `rclcpp::SensorDataQoS()` (Best-Effort, Volatile) for high-rate loss-tolerant sensors (LiDAR/Camera), and `Reliable + TransientLocal` for latched state like `/map` and `/robot_description`.',
        ],
        deepDive: [
          {
            title: '1. DDS: Decentralized Pub/Sub Middleware',
            body: 'DDS (Data Distribution Service) uses RTPS over UDP multicast (or shared memory on localhost) for peer-to-peer discovery. Every process with the same `ROS_DOMAIN_ID` discovers peers automatically. Unlike TCP sockets, DDS separates *transport reliability* from *discovery* via Quality of Service (QoS) policies.',
            cppBridge:
              'Think of QoS policies as a compile-time/runtime contract handshake between `DataWriter` (publisher) and `DataReader` (subscriber) — if the contract is incompatible, zero bytes are delivered.',
          },
          {
            title: '2. The #1 ROS 2 Newcomer Trap: SensorDataQoS vs Default QoS',
            body: 'In `rclcpp`, passing an integer like `create_subscription<LaserScan>("/scan", 10, cb)` defaults to `RELIABLE` + `VOLATILE`. However, most real hardware LiDAR and camera drivers publish with `rclcpp::SensorDataQoS()` (`BEST_EFFORT` + `VOLATILE`) to avoid retransmission head-of-line blocking over Wi-Fi. Result: `RELIABLE` sub + `BEST_EFFORT` pub = silent connection failure!',
            code: `// Correct C++ subscription for high-frequency LiDAR / IMU:
scan_sub_ = this->create_subscription<sensor_msgs::msg::LaserScan>(
  "/scan",
  rclcpp::SensorDataQoS(),
  [this](sensor_msgs::msg::LaserScan::ConstSharedPtr msg) {
    process_scan(*msg);
  });

// Correct C++ latched publisher for static map or robot URDF:
auto map_qos = rclcpp::QoS(rclcpp::KeepLast(1)).reliable().transient_local();
map_pub_ = this->create_publisher<nav_msgs::msg::OccupancyGrid>("/map", map_qos);`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u1_n3_e1',
            type: 'spot-the-bug',
            prompt:
              'Your C++ node subscribes to `/scan` using queue depth `10`, while the LiDAR driver uses `rclcpp::SensorDataQoS()`. `ros2 topic hz /scan` works, but your callback NEVER fires. Why?',
            codeSnippet: `sub_ = this->create_subscription<sensor_msgs::msg::LaserScan>(
  "/scan", 10, std::bind(&ObstacleNode::on_scan, this, std::placeholders::_1));`,
            language: 'cpp',
            options: [
              'std::bind cannot be used with LaserScan',
              'Depth `10` implies RELIABLE QoS, which is incompatible with the driver’s BEST_EFFORT SensorDataQoS',
              'LaserScan messages exceed UDP MTU so DDS drops them',
              'The topic name must not start with a slash',
            ],
            correctIndex: 1,
            explanation:
              'Passing integer `10` constructs `rclcpp::QoS(10)` with `RELIABLE` reliability. A `RELIABLE` subscriber refuses to match a `BEST_EFFORT` publisher. Pass `rclcpp::SensorDataQoS()` instead.',
            seniorTip:
              'Run `ros2 topic info /scan --verbose` whenever a callback silently fails to fire — it prints every endpoint’s Reliability and Durability side by side.',
          },
          {
            id: 'u1_n3_e2',
            type: 'multiple-choice',
            prompt:
              'Two robots on the same factory Wi-Fi both publish `/cmd_vel` and `/odom`. How do you isolate their DDS graphs with zero C++ code changes?',
            options: [
              'Export a distinct `ROS_DOMAIN_ID` (e.g., 10 vs 11) in each robot’s environment',
              'Use `BEST_EFFORT` QoS on both robots',
              'Disable `rclcpp::spin()`',
              'Change `CMakeLists.txt` project names',
            ],
            correctIndex: 0,
            explanation:
              '`ROS_DOMAIN_ID` shifts the DDS RTPS UDP discovery ports, completely isolating each robot’s computation graph on the same LAN.',
          },
          {
            id: 'u1_n3_e3',
            type: 'multiple-choice',
            prompt:
              'You publish a `/map` `OccupancyGrid` once at startup. RViz2 launches 5 seconds later and shows "No map received". Which QoS change fixes this?',
            options: [
              'Change Durability from `volatile()` to `transient_local()` on both publisher and subscriber',
              'Set History to `KeepLast(100)`',
              'Change Reliability to `best_effort()`',
              'Use `std::unique_ptr` on publish',
            ],
            correctIndex: 0,
            explanation:
              '`transient_local()` durability instructs the DDS DataWriter to cache the last N samples and automatically deliver them to late-joining DataReaders.',
          },
        ],
      },
      {
        id: 'u1_n4',
        unitId: 'unit_1',
        title: 'Executors, Callback Groups & Zero-Copy IPC',
        subtitle: 'Avoiding deadlocks & passing 4K PointClouds via std::unique_ptr',
        kind: 'boss',
        estimatedMinutes: 12,
        xpReward: 90,
        linkedLabId: 'lab_cpp_executor_deadlock',
        keyTakeaways: [
          'By default, all callbacks in an `rclcpp::Node` belong to one `MutuallyExclusive` callback group and run serially on `SingleThreadedExecutor`.',
          'Calling a synchronous service wait inside a callback on a `SingleThreadedExecutor` causes a classic single-thread deadlock.',
          'Composable Nodes (`rclcpp_components`) inside a `ComponentContainer` with `use_intra_process_comms(true)` transfer `std::unique_ptr<MsgT>` zero-copy!',
        ],
        deepDive: [
          {
            title: '1. Executors & Callback Groups (C++ Concurrency Model)',
            body: 'An `rclcpp::Executor` is an event-loop dispatcher backed by an OS WaitSet (`rcl_wait`). `SingleThreadedExecutor` drains ready timers, subscriptions, and service responses sequentially on 1 thread. To run callbacks concurrently on a thread pool, you MUST: (1) use `rclcpp::executors::MultiThreadedExecutor`, AND (2) assign callbacks to either `CallbackGroupType::Reentrant` or distinct `CallbackGroupType::MutuallyExclusive` groups.',
            cppBridge:
              'Think of `MutuallyExclusive` as a per-group implicit `std::mutex` managed by the executor scheduler, and `Reentrant` as lock-free concurrent dispatch across the thread pool.',
            code: `cb_group_ = this->create_callback_group(rclcpp::CallbackGroupType::Reentrant);
auto sub_opt = rclcpp::SubscriptionOptions();
sub_opt.callback_group = cb_group_;

sub_ = this->create_subscription<sensor_msgs::msg::Imu>(
  "/imu", rclcpp::SensorDataQoS(), cb, sub_opt);`,
            language: 'cpp',
          },
          {
            title: '2. Zero-Copy Intra-Process Communication with std::unique_ptr',
            body: 'Serializing a 12 MB RGB-D `PointCloud2` at 30 Hz (360 MB/s) over CDR/UDP burns huge CPU. When multiple C++ `ComposableNode`s share a process (`ComponentContainer`) with `use_intra_process_comms(true)`, publishing a `std::unique_ptr<MsgT>` via `std::move` transfers ownership directly in memory with zero serialization and zero memcpy (for a single subscriber).',
            code: `// Zero-copy intra-process publish in rclcpp:
auto msg = std::make_unique<sensor_msgs::msg::Image>();
// ... populate msg->data ...
image_pub_->publish(std::move(msg)); // Ownership transferred, 0 copies!`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u1_n4_e1',
            type: 'spot-the-bug',
            prompt:
              'In `rclcpp`, why does this perception publisher STILL copy the 12 MB `PointCloud2` even inside a `ComponentContainer` with intra-process comms enabled?',
            codeSnippet: `sensor_msgs::msg::PointCloud2 msg;
fill_cloud(msg);
cloud_pub_->publish(msg);`,
            language: 'cpp',
            options: [
              'PointCloud2 is too big for intra-process comms',
              'Publishing by const reference (`const MsgT&`) prevents ownership transfer, forcing a copy; you must publish `std::unique_ptr<PointCloud2>` via `std::move`',
              'Intra-process comms only works in Python',
              'Missing `rclcpp::spin_some()`',
            ],
            correctIndex: 1,
            explanation:
              'Because the caller retains `msg` on its stack, `rclcpp` cannot safely hand the pointer to a subscriber without copying. Constructing `std::make_unique<PointCloud2>()` and calling `publish(std::move(msg))` unlocks true zero-copy pointer handoff.',
          },
          {
            id: 'u1_n4_e2',
            type: 'architecture-tradeoff',
            prompt:
              'You have a 100 Hz IMU callback (fast, non-blocking) and a 1 Hz heavy path-planning timer (takes 80 ms). You want them to run concurrently in `MultiThreadedExecutor`, while guaranteeing two instances of the 1 Hz timer NEVER overlap.',
            options: [
              'Put both in one `Reentrant` callback group',
              'Put IMU in `MutuallyExclusive` group A and the timer in `MutuallyExclusive` group B',
              'Put both in the default `MutuallyExclusive` group',
              'Use `SingleThreadedExecutor`',
            ],
            correctIndex: 1,
            explanation:
              'Separate `MutuallyExclusive` groups run in parallel with each other on `MultiThreadedExecutor`, while each group prevents self-reentrancy.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_2',
    number: 2,
    title: 'Pub/Sub, Actions, Params & Lifecycle (C++)',
    description:
      'Master async C++ service clients, preemptable rclcpp_action servers, dynamic parameters, and Managed Lifecycle Nodes.',
    color: 'sky',
    badgeName: 'IPC & Lifecycle Architect',
    nodes: [
      {
        id: 'u2_n1',
        unitId: 'unit_2',
        title: 'Topics, Async Services & Deadlock Avoidance',
        subtitle: 'Choosing Topics vs Services vs Actions in rclcpp',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 50,
        keyTakeaways: [
          'Topics: continuous data streams (sensors, `/cmd_vel`, `/odom`).',
          'Services: brief RPC request/response (<50 ms) — never call `rclcpp::spin_until_future_complete` from inside a callback!',
          'Use `client->async_send_request(req, callback)` for non-blocking continuation in `rclcpp`.',
        ],
        deepDive: [
          {
            title: '1. Why Calling a Service Synchronously Inside a Callback Deadlocks',
            body: 'A common C++ bug when coming from blocking RPC frameworks: inside a timer or subscription callback, you call `auto result = client->async_send_request(req); result.wait();` (or `spin_until_future_complete`). On a `SingleThreadedExecutor`, the executor thread is now blocked inside your callback waiting on the `std::shared_future` — so it can NEVER return to the WaitSet to process the incoming DDS service response!',
            code: `// SAFE non-blocking C++ pattern (async continuation):
auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
client_->async_send_request(req,
  [this](rclcpp::Client<std_srvs::srv::Trigger>::SharedFuture future) {
    auto res = future.get();
    RCLCPP_INFO(get_logger(), "Calibration: %s", res->success ? "OK" : "FAIL");
  });`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u2_n1_e1',
            type: 'spot-the-bug',
            prompt:
              'Why does this `rclcpp` node hang forever inside `on_timer()` when calling `/calibrate_imu`?',
            codeSnippet: `void on_timer() {
  auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
  auto future = client_->async_send_request(req);
  if (future.wait_for(5s) == std::future_status::ready) { /* ... */ }
}`,
            language: 'cpp',
            options: [
              'Trigger::Request has no fields',
              '`future.wait_for(5s)` blocks the single executor thread, starving the service response callback',
              '5s is too short for DDS',
              'async_send_request requires std::unique_ptr',
            ],
            correctIndex: 1,
            explanation:
              'Blocking the executor thread inside `on_timer()` prevents the executor from spinning and fulfilling `future`. Pass a response callback lambda to `async_send_request(req, cb)` instead.',
          },
          {
            id: 'u2_n1_e2',
            type: 'architecture-tradeoff',
            prompt:
              'You are building a robotic arm pick-and-place routine taking ~6 seconds that must stream % completion and allow instant E-stop preemption. Which ROS 2 primitive?',
            options: [
              'A Service `/pick_object`',
              'A Topic `/pick_cmd`',
              'An `rclcpp_action` Server `/pick_object`',
              'A ROS 2 Parameter',
            ],
            correctIndex: 2,
            explanation:
              'Actions are designed specifically for long-running, goal-oriented, preemptable tasks with continuous feedback and terminal states (SUCCEEDED / ABORTED / CANCELED).',
          },
        ],
      },
      {
        id: 'u2_n2',
        unitId: 'unit_2',
        title: 'Preemptable Actions (rclcpp_action) & Params',
        subtitle: 'Goal/Cancel/Accepted callbacks and dynamic parameter validation',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 55,
        keyTakeaways: [
          '`rclcpp_action::Server` uses 3 callbacks: `handle_goal` (accept/reject), `handle_cancel` (preemption request), and `handle_accepted` (spawn worker thread so executor stays responsive).',
          'Declare parameters via `declare_parameter<double>("max_speed", 0.5)` and validate runtime updates via `add_on_set_parameters_callback`.',
        ],
        deepDive: [
          {
            title: '1. The 3-Callback Pattern of rclcpp_action::Server',
            body: 'In `rclcpp_action`, `handle_accepted` runs on the executor thread. If you execute a 10-second loop directly inside `handle_accepted`, you block cancellation requests! Always detach or dispatch work to a `std::thread` inside `handle_accepted`, periodically checking `goal_handle->is_canceling()`.',
            code: `void handle_accepted(const std::shared_ptr<GoalHandle> goal_handle) {
  // Spawn worker thread so executor can still process cancel requests!
  std::thread{std::bind(&NavActionServer::execute, this, goal_handle)}.detach();
}

void execute(const std::shared_ptr<GoalHandle> goal_handle) {
  auto feedback = std::make_shared<Navigate::Feedback>();
  while (rclcpp::ok() && !reached_goal()) {
    if (goal_handle->is_canceling()) {
      goal_handle->canceled(std::make_shared<Navigate::Result>());
      return;
    }
    goal_handle->publish_feedback(feedback);
    std::this_thread::sleep_for(100ms);
  }
  goal_handle->succeed(std::make_shared<Navigate::Result>());
}`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u2_n2_e1',
            type: 'spot-the-bug',
            prompt:
              'Clients send a Cancel request to your `rclcpp_action::Server`, but `handle_cancel` never runs until the 15-second goal finishes. Why?',
            options: [
              'The `execute()` loop is running directly inside `handle_accepted()` on the executor thread instead of a separate thread',
              'Missing `goal_handle->publish_feedback()`',
              'Action goals cannot be canceled in ROS 2',
              'The Result struct is empty',
            ],
            correctIndex: 0,
            explanation:
              'Running the blocking goal loop inside `handle_accepted()` ties up the executor thread, preventing `handle_cancel` from being dispatched.',
          },
          {
            id: 'u2_n2_e2',
            type: 'code-fill',
            prompt:
              'Inside the action worker loop, which check detects that a client requested preemption/cancellation?',
            language: 'cpp',
            codeSnippet: `if (goal_handle->____()) {
  goal_handle->canceled(result);
  return;
}`,
            options: ['is_canceling', 'is_aborted', 'has_stopped', 'cancel_pending'],
            correctIndex: 0,
            explanation:
              '`goal_handle->is_canceling()` returns `true` once `handle_cancel` returns `CancelResponse::ACCEPT`.',
          },
        ],
      },
      {
        id: 'u2_n3',
        unitId: 'unit_2',
        title: 'Managed Lifecycle Nodes (rclcpp_lifecycle)',
        subtitle: 'Deterministic hardware initialization and safe shutdown',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 75,
        linkedLabId: 'lab_cpp_lifecycle',
        keyTakeaways: [
          'Inherit from `rclcpp_lifecycle::LifecycleNode` instead of `rclcpp::Node` for deterministic state management.',
          'Allocate memory/publishers in `on_configure`; enable motor output in `on_activate`; zero velocities & disable hardware in `on_deactivate`.',
          '`LifecyclePublisher::publish()` suppresses messages automatically whenever the node is not in `Active` state.',
        ],
        deepDive: [
          {
            title: '1. Why Robotics Needs a State Machine Around Every Critical Node',
            body: 'If you launch 15 nodes simultaneously on a robot, `/controller_server` might try commanding `/cmd_vel` before `/lidar_driver` or `/map_server` is ready. `rclcpp_lifecycle::LifecycleNode` solves this by exposing standard transitions (`Unconfigured -> Inactive -> Active -> Finalized`) orchestrated by a supervisor like `nav2_lifecycle_manager`.',
            code: `using CallbackReturn =
  rclcpp_lifecycle::node_interfaces::LifecycleNodeInterface::CallbackReturn;

CallbackReturn on_configure(const rclcpp_lifecycle::State &) override {
  cmd_pub_ = this->create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);
  return CallbackReturn::SUCCESS;
}

CallbackReturn on_activate(const rclcpp_lifecycle::State & state) override {
  LifecycleNode::on_activate(state); // Activates all LifecyclePublishers
  return CallbackReturn::SUCCESS;
}`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u2_n3_e1',
            type: 'sequence-order',
            prompt:
              'Order the lifecycle states/transitions to bring a `LifecycleNode` from boot to active motor control:',
            options: [
              'Unconfigured',
              'Configuring (`on_configure`)',
              'Inactive',
              'Activating (`on_activate`)',
              'Active',
            ],
            correctOrder: [
              'Unconfigured',
              'Configuring (`on_configure`)',
              'Inactive',
              'Activating (`on_activate`)',
              'Active',
            ],
            explanation:
              'Separating configuration (resource allocation) from activation (starting actuation) prevents race conditions during robot bringup.',
          },
          {
            id: 'u2_n3_e2',
            type: 'multiple-choice',
            prompt:
              'What happens if a timer calls `cmd_pub_->publish(twist)` on an `rclcpp_lifecycle::LifecyclePublisher` while the node is `Inactive`?',
            options: [
              'It throws a segmentation fault',
              'The `LifecyclePublisher` safely suppresses the message (nothing goes on the wire)',
              'It automatically transitions the node to `Active`',
              'It blocks until `on_activate` is called',
            ],
            correctIndex: 1,
            explanation:
              'Lifecycle publishers gate transmissions based on activation state, preventing stray motor commands during configuration or teardown.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_3',
    number: 3,
    title: '3D Geometry, URDF & TF2 Transforms',
    description:
      'Learn robotics spatial math from scratch: REP-103 conventions, Quaternions vs Euler angles, URDF inertia tensors, and C++ TF2 lookups.',
    color: 'violet',
    badgeName: 'TF2 & Spatial Math Master',
    nodes: [
      {
        id: 'u3_n1',
        unitId: 'unit_3',
        title: 'Coordinate Frames, Quaternions & SE(3)',
        subtitle: 'Why robots track 15+ coordinate frames and avoid Euler gimbal lock',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 60,
        linkedSimTab: 'tf2',
        keyTakeaways: [
          'REP-103 Right-Handed Rule: +X Forward (Red), +Y Left (Green), +Z Up (Blue).',
          'A LiDAR measures obstacles relative to `laser_frame`; the wheels actuate around `base_link`; the map lives in `map`. Transforms convert points between frames.',
          'ROS uses unit Quaternions `(x, y, z, w)` instead of Roll-Pitch-Yaw because Euler angles suffer singularities (gimbal lock) and discontinuous interpolation.',
        ],
        deepDive: [
          {
            title: '1. Why Every Sensor Has Its Own Coordinate Frame',
            body: 'Imagine a LiDAR mounted 20 cm forward and rotated 180° upside-down on a robot. When the LiDAR reports an obstacle at `(x=1.0, y=0.0)` in `laser_frame`, that obstacle might actually be *behind* the robot in `base_link`! Robotics tracks every rigid body and sensor as a named **frame** connected by 3D rigid-body transforms $T \\in SE(3)$ (3D translation + 3D rotation).',
          },
          {
            title: '2. Quaternions in C++ (`tf2::Quaternion`)',
            body: 'Euler angles (Roll, Pitch, Yaw) are intuitive for humans, but lose a degree of freedom at ±90° pitch (gimbal lock) and depend on axis order (XYZ vs ZYX). Unit quaternions `q = (x, y, z, w)` with `||q|| = 1` smoothly interpolate (SLERP) and compose cleanly via `tf2::Quaternion`.',
            code: `#include "tf2/LinearMath/Quaternion.h"
#include "tf2_geometry_msgs/tf2_geometry_msgs.hpp"

tf2::Quaternion q;
q.setRPY(0.0, 0.0, M_PI_2); // +90 deg yaw (CCW around +Z)
geometry_msgs::msg::Quaternion msg_q = tf2::toMsg(q);`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u3_n1_e1',
            type: 'multiple-choice',
            prompt:
              'According to ROS REP-103 standard coordinate conventions on a mobile robot, which direction does `+Y` point?',
            options: [
              'Forward (front of robot)',
              'Left of the robot',
              'Right of the robot',
              'Straight down into the floor',
            ],
            correctIndex: 1,
            explanation:
              'ROS REP-103 defines a right-handed frame: +X is forward, +Y is left, and +Z is up. Rotating +X toward +Y via the right-hand rule gives +Z up (counter-clockwise yaw is positive).',
          },
          {
            id: 'u3_n1_e2',
            type: 'multiple-choice',
            prompt:
              'In the REP-105 standard mobile robot frame tree `map -> odom -> base_link`, why are there TWO parent frames (`map` and `odom`) above `base_link`?',
            options: [
              'Because TF2 requires at least 3 frames to compile',
              '`odom -> base_link` is locally smooth/continuous (for velocity control), while `map -> odom` absorbs discrete localization jumps from SLAM/AMCL without destabilizing the local controller',
              '`map` is only for 3D arms and `odom` is for wheels',
              'To duplicate sensor data for redundancy',
            ],
            correctIndex: 1,
            explanation:
              'A local controller running at 20 Hz will jerk violently if `base_link` suddenly teleports 10 cm when AMCL corrects drift. Keeping `odom -> base_link` continuous and pushing global corrections into `map -> odom` gives the best of both worlds.',
          },
        ],
      },
      {
        id: 'u3_n2',
        unitId: 'unit_3',
        title: 'URDF, Xacro & Inertia Physics',
        subtitle: 'Describing robot links, joints, and mass properties for simulation',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 70,
        linkedLabId: 'lab_urdf_lidar',
        keyTakeaways: [
          'URDF models a robot as a strict tree of `<link>` (rigid bodies) and `<joint>` (`fixed`, `revolute`, `continuous`, `prismatic`).',
          'Each `<link>` has three sections: `<visual>` (rendering), `<collision>` (physics contact), and `<inertial>` (mass + 3×3 symmetric inertia tensor `ixx, iyy, izz`).',
          '`robot_state_publisher` consumes `/robot_description` + `/joint_states` to broadcast `/tf_static` and `/tf` automatically.',
        ],
        deepDive: [
          {
            title: '1. Visual vs Collision vs Inertial',
            body: 'Newcomers often copy a high-poly STL mesh into `<collision>` — tanking Gazebo physics FPS from 60 Hz to 3 Hz! Always use simple primitives (`<box>`, `<cylinder>`, `<sphere>`) for `<collision>`, and compute valid positive `<inertial>` tensors (`I = 1/12 * m * (h² + d²)`) so the physics solver never explodes with NaN.',
          },
        ],
        exercises: [
          {
            id: 'u3_n2_e1',
            type: 'multiple-choice',
            prompt:
              'Which URDF joint type should you use for a differential-drive robot’s powered wheel that rotates endlessly without angle limits?',
            options: ['fixed', 'revolute', 'continuous', 'prismatic'],
            correctIndex: 2,
            explanation:
              '`revolute` requires upper/lower angle limits (e.g., an elbow joint). `continuous` allows unbounded 360° rotation, making it the standard choice for wheels.',
          },
          {
            id: 'u3_n2_e2',
            type: 'spot-the-bug',
            prompt:
              'Your robot spawns in Gazebo Sim and immediately shoots into the sky or collapses with NaN joint velocities. What URDF mistake causes this?',
            options: [
              'Zero/missing `<inertial>` mass or non-positive-definite inertia matrix (`ixx <= 0`)',
              'Using Xacro macros',
              'Naming the root link `base_link`',
              'Setting joint type to `fixed`',
            ],
            correctIndex: 0,
            explanation:
              'Physics engines invert the inertia matrix ($\\alpha = I^{-1}\\tau$). Zero mass or zero diagonal inertia entries produce division by zero / singular matrices.',
          },
        ],
      },
      {
        id: 'u3_n3',
        unitId: 'unit_3',
        title: 'TF2 Listeners, Broadcasters & Time Travel (C++)',
        subtitle: 'Querying transforms safely with tf2_ros::Buffer & tf2::doTransform',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 75,
        linkedLabId: 'lab_cpp_tf2_listener',
        keyTakeaways: [
          'Always store `tf2_ros::Buffer` and `tf2_ros::TransformListener` as member variables (`std::shared_ptr`/`unique_ptr`) so `/tf` stays subscribed.',
          'Pass `tf2::TimePointZero` for the latest transform, or a small timeout (`tf2::durationFromSec(0.1)`) when looking up a sensor timestamp.',
          'Use `tf2::doTransform(point_in, point_out, transform)` to project sensor points between frames cleanly.',
        ],
        deepDive: [
          {
            title: '1. C++ TF2 Lookup Pattern',
            body: 'In C++, `tf2_ros::Buffer` maintains a 10-second sliding ring buffer of all transforms on `/tf` and `/tf_static`, interpolating linearly for translations and SLERPing for quaternions.',
            code: `tf_buffer_ = std::make_unique<tf2_ros::Buffer>(this->get_clock());
tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

try {
  auto tf = tf_buffer_->lookupTransform(
    "base_link", "laser_frame", tf2::TimePointZero);
  geometry_msgs::msg::PointStamped pt_base;
  tf2::doTransform(pt_laser, pt_base, tf);
} catch (const tf2::TransformException & ex) {
  RCLCPP_WARN(get_logger(), "TF lookup failed: %s", ex.what());
}`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u3_n3_e1',
            type: 'multiple-choice',
            prompt:
              'Why does `tf_buffer_->lookupTransform("map", "laser_frame", msg->header.stamp)` occasionally throw `tf2::ExtrapolationException` in real robots?',
            options: [
              'Because the sensor scan arrives a few milliseconds before the latest `odom -> base_link` transform for that exact timestamp has been published',
              'Because `laser_frame` is not in C++',
              'Because TF2 only works with 2D coordinates',
              'Because `std::make_unique` deletes the buffer',
            ],
            correctIndex: 0,
            explanation:
              'Network/serial jitter causes sensor messages and odometry TF broadcasts to arrive slightly out of order. Passing a timeout (`tf2::durationFromSec(0.05)`) or using `tf2_ros::MessageFilter` waits until the matching TF arrives.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_4',
    number: 4,
    title: 'Kinematics, PID Control & Sensor Fusion',
    description:
      'Master robotics math & physics from first principles: diff-drive unicycle kinematics, PID tuning + anti-windup, and EKF sensor fusion.',
    color: 'amber',
    badgeName: 'Control & Estimation Engineer',
    nodes: [
      {
        id: 'u4_n1',
        unitId: 'unit_4',
        title: 'Differential-Drive Kinematics & Odometry',
        subtitle: 'Mapping wheel speeds (v_L, v_R) to chassis motion (v, ω)',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 65,
        linkedSimTab: 'diffdrive',
        keyTakeaways: [
          'Forward kinematics: Linear velocity v = (v_R + v_L) / 2, Angular velocity ω = (v_R - v_L) / L (where L is wheel separation).',
          'Inverse kinematics: v_L = v - (ω * L / 2), v_R = v + (ω * L / 2).',
          'Odometry integrates encoder ticks over dt into (x, y, θ) — any tiny wheel-radius calibration error or slip integrates into unbounded heading drift!',
        ],
        deepDive: [
          {
            title: '1. From Wheel Encoders to Chassis Velocity (v, ω)',
            body: 'A differential-drive robot has two driven wheels separated by wheelbase $L$. If both spin forward at speed $v$, the robot moves straight ($\\omega = 0$). If the right wheel spins faster ($v_R > v_L$), the robot arcs left (positive $\\omega$ by right-hand rule around $+Z$).',
            code: `// Differential drive kinematics in C++:
double v = 0.5 * (v_right + v_left);
double omega = (v_right - v_left) / wheel_separation;

// Dead-reckoning Euler integration over dt:
x_ += v * std::cos(theta_) * dt;
y_ += v * std::sin(theta_) * dt;
theta_ += omega * dt;`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u4_n1_e1',
            type: 'multiple-choice',
            prompt:
              'A differential-drive robot has wheelbase L = 0.5 m. You command pure in-place rotation: v = 0.0 m/s, ω = +2.0 rad/s (counter-clockwise). What are (v_L, v_R)?',
            options: [
              'v_L = +0.5 m/s, v_R = -0.5 m/s',
              'v_L = -0.5 m/s, v_R = +0.5 m/s',
              'v_L = +1.0 m/s, v_R = +1.0 m/s',
              'v_L = 0.0 m/s, v_R = +1.0 m/s',
            ],
            correctIndex: 1,
            explanation:
              'Using inverse kinematics: v_L = 0 - (2.0 * 0.5)/2 = -0.5 m/s (backward), v_R = 0 + (2.0 * 0.5)/2 = +0.5 m/s (forward). Spinning right wheel forward and left backward turns CCW (+ω).',
          },
          {
            id: 'u4_n1_e2',
            type: 'multiple-choice',
            prompt:
              'Why is wheel odometry (`odom`) accurate over 1 meter, yet drifts terribly over 50 meters?',
            options: [
              'DDS drops odometry messages after 10 meters',
              'Dead-reckoning integrates small wheel-slip and tire-radius errors over time; angular heading error θ compounds quadratically into (x, y) position error',
              'C++ double precision overflows after 50 meters',
              'Encoders cannot measure negative velocities',
            ],
            correctIndex: 1,
            explanation:
              'A 2° heading error from turning on slick concrete makes every subsequent forward step point in the wrong direction. That is why we fuse IMU gyro + SLAM!',
          },
        ],
      },
      {
        id: 'u4_n2',
        unitId: 'unit_4',
        title: 'PID Control Physics & Anti-Windup',
        subtitle: 'Springs, dampers, derivative noise filtering & actuator clamping',
        kind: 'lab',
        estimatedMinutes: 10,
        xpReward: 65,
        linkedSimTab: 'pid',
        keyTakeaways: [
          'Proportional (Kp) acts like a virtual spring pulling error to zero; too high causes oscillation.',
          'Derivative (Kd) acts like a virtual shock absorber damping velocity/overshoot, but amplifies high-frequency sensor noise.',
          'Integral (Ki) eliminates steady-state bias (friction, gravity) — MUST have anti-windup clamping when actuators saturate!',
        ],
        deepDive: [
          {
            title: '1. Physical Intuition of PID for Software Engineers',
            body: 'Think of a robot joint trying to reach target angle $r$. Error is $e(t) = r - y(t)$. $K_p \\cdot e$ pulls toward the target. $K_d \\cdot \\dot{e}$ brakes as you approach quickly so you don’t overshoot. $K_i \\int e\\,dt$ remembers persistent stubborn error (like gravity pulling an arm down) and pushes harder until steady-state error hits zero.',
            code: `// Safe C++ PID step with anti-windup clamping:
double err = setpoint - measured;
double deriv = (err - prev_err_) / dt;
prev_err_ = err;

double raw_u = kp_ * err + ki_ * integral_ + kd_ * deriv;
double u = std::clamp(raw_u, -max_effort_, max_effort_);

// Conditional integration anti-windup: only integrate when not saturated!
if (u == raw_u) {
  integral_ += err * dt;
}`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u4_n2_e1',
            type: 'multiple-choice',
            prompt:
              'A rover gets stuck against a threshold for 4 seconds while commanded forward. When lifted over the threshold, it rockets forward at full power and crashes. What failed?',
            options: [
              'Kp was negative',
              'Integral windup: the integral accumulator grew huge while blocked; conditional integration / clamping anti-windup was missing',
              'Derivative term was too small',
              'dt was measured in seconds instead of hours',
            ],
            correctIndex: 1,
            explanation:
              'During saturation/stall, `integral_` keeps growing unboundedly ("windup"). Stopping integration whenever actuator output is clamped prevents violent post-stall overshoot.',
          },
        ],
      },
      {
        id: 'u4_n3',
        unitId: 'unit_4',
        title: 'Sensor Fusion & EKF (robot_localization)',
        subtitle: 'Why no single sensor is enough & how Kalman covariance works',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 65,
        keyTakeaways: [
          'Sensors have complementary failure modes: Wheel encoders measure linear speed well (but slip on yaw); IMUs measure angular rate well (but double-integrated position drifts fast).',
          'An Extended Kalman Filter (EKF) alternates: (1) Predict next state via motion model, and (2) Update/correct state weighted by sensor vs model uncertainty (Covariance).',
          'In `robot_localization`, disable `publish_tf` on raw wheel odometry so `ekf_filter_node` is the single TF authority for `odom -> base_link`.',
        ],
        deepDive: [
          {
            title: '1. Kalman Gain in Plain English',
            body: 'Every ROS 2 sensor message (`Odometry`, `Imu`) carries a $6 \\times 6$ `covariance` matrix representing variance ($\\sigma^2$). The EKF computes the Kalman Gain $K = P H^T (H P H^T + R)^{-1}$. When sensor noise $R$ is small relative to state uncertainty $P$, $K \\to 1$ (trust the sensor). When $R$ is huge, $K \\to 0$ (trust the motion prediction).',
          },
        ],
        exercises: [
          {
            id: 'u4_n3_e1',
            type: 'architecture-tradeoff',
            prompt:
              'Configuring `robot_localization` EKF for a mobile robot with wheel encoders (`/odom`) and an IMU (`/imu/data`), which signals should you fuse?',
            options: [
              'Fuse absolute X, Y, Yaw from both `/odom` and `/imu/data`',
              'Fuse `vx` from `/odom` and `vyaw` + `orientation` from `/imu/data`',
              'Set every covariance entry to `0.0` so the filter trusts both 100%',
              'Fuse acceleration `ax` alone to compute position',
            ],
            correctIndex: 1,
            explanation:
              'Fusing `vx` from wheel encoders and `vyaw` from the IMU gives accurate translation without wheel-slip yaw corruption. Setting covariance to `0.0` causes singular matrix issues.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_5',
    number: 5,
    title: 'SLAM, Path Planning & Nav2 (C++)',
    description:
      'Build maps with slam_toolbox, understand Configuration Space & Costmaps, tune MPPI, and write C++ BehaviorTree.CPP plugins.',
    color: 'rose',
    badgeName: 'Nav2 & BT.CPP Navigator',
    nodes: [
      {
        id: 'u5_n1',
        unitId: 'unit_5',
        title: 'Occupancy Grids, SLAM & Costmaps',
        subtitle: 'From LiDAR LaserScan polar ranges to Configuration Space inflation',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 75,
        linkedLabId: 'lab_nav2_yaml',
        keyTakeaways: [
          '2D LiDAR emits `sensor_msgs::msg::LaserScan` (polar ranges `r[i]` at angle `angle_min + i * angle_increment`), projected to Cartesian `(r*cos(θ), r*sin(θ))`.',
          'SLAM (`slam_toolbox`) builds a 2D `OccupancyGrid` (-1 unknown, 0 free, 100 occupied) and performs pose-graph loop closure when revisiting known rooms.',
          'Costmaps inflate obstacles by `robot_radius` + safety margin (`inflation_radius`) so the planner can treat the robot as a single point in Configuration Space (C-space).',
        ],
        deepDive: [
          {
            title: '1. Configuration Space (C-Space) & Costmap Inflation',
            body: 'Planning for a 0.70 m wide robot directly against 1-pixel walls is hard. By inflating every obstacle cell outward by `robot_radius` (`0.35 m`), any point outside the lethal inflated zone is guaranteed collision-free for the robot’s center! Adding a smooth exponential cost decay up to `inflation_radius` (`0.55 m`) encourages paths down the center of hallways.',
          },
        ],
        exercises: [
          {
            id: 'u5_n1_e1',
            type: 'spot-the-bug',
            prompt:
              'Your robot scrapes walls on tight turns. Inspect `nav2_params.yaml` — why?',
            codeSnippet: `robot_radius: 0.35
inflation_layer:
  plugin: "nav2_costmap_2d::InflationLayer"
  inflation_radius: 0.20`,
            language: 'yaml',
            options: [
              '`inflation_radius` (0.20) is smaller than `robot_radius` (0.35), leaving no safe clearance gradient outside the chassis',
              'InflationLayer only works in `map` frame',
              'robot_radius must be negative',
              'YAML indentation uses 2 spaces',
            ],
            correctIndex: 0,
            explanation:
              '`inflation_radius` must always exceed `robot_radius` so the costmap creates a soft repulsive buffer around walls.',
          },
          {
            id: 'u5_n1_e2',
            type: 'multiple-choice',
            prompt:
              'In Nav2, why does `local_costmap` operate in `global_frame: odom` while `global_costmap` operates in `global_frame: map`?',
            options: [
              'Because `odom` never jumps discontinuously during AMCL/SLAM loop closures, keeping 20 Hz obstacle avoidance smooth',
              'Because `local_costmap` cannot read LaserScan in `map` frame',
              'Because `map` is 3D and `odom` is 2D',
              'To double RAM usage',
            ],
            correctIndex: 0,
            explanation:
              'Global localization jumps would make the local controller swerve abruptly; `odom` guarantees smooth short-horizon control.',
          },
        ],
      },
      {
        id: 'u5_n2',
        unitId: 'unit_5',
        title: 'Behavior Trees in C++ (BehaviorTree.CPP)',
        subtitle: 'Writing custom Nav2 BT action nodes in modern C++',
        kind: 'assignment',
        estimatedMinutes: 12,
        xpReward: 80,
        linkedLabId: 'lab_cpp_bt_node',
        keyTakeaways: [
          'Nav2’s `bt_navigator` runs `BehaviorTree.CPP` — modular trees of `Sequence` (AND), `Fallback` (OR / recovery), and leaf `Action`/`Condition` nodes.',
          'Each node implements `tick()` returning `BT::NodeStatus::SUCCESS`, `FAILURE`, or `RUNNING` — never block inside `tick()`!',
          'Nodes communicate via a typed `Blackboard` (`getInput<T>("key")`, `setOutput("key", val)`).',
        ],
        deepDive: [
          {
            title: '1. Custom C++ BT::SyncActionNode',
            body: 'Unlike Finite State Machines where $N$ states require $O(N^2)$ transition edges, Behavior Trees compose hierarchically. A `Fallback` tries `FollowPath`; if an obstacle blocks it (`FAILURE`), it automatically ticks `ClearEntireCostmap` -> `Spin` -> `BackUp`.',
            code: `class CheckBattery : public BT::ConditionNode {
public:
  CheckBattery(const std::string & name, const BT::NodeConfig & config)
  : BT::ConditionNode(name, config) {}

  static BT::PortsList providedPorts() {
    return { BT::InputPort<double>("min_voltage") };
  }

  BT::NodeStatus tick() override {
    double min_v = 22.0;
    getInput("min_voltage", min_v);
    return (current_voltage_ >= min_v)
      ? BT::NodeStatus::SUCCESS : BT::NodeStatus::FAILURE;
  }
};`,
            language: 'cpp',
          },
        ],
        exercises: [
          {
            id: 'u5_n2_e1',
            type: 'multiple-choice',
            prompt:
              'In `BehaviorTree.CPP`, what happens if you run a `while (!goal_done) sleep(10ms);` loop inside a `BT::SyncActionNode::tick()`?',
            options: [
              'It runs in a background thread automatically',
              'It freezes the entire Behavior Tree tick loop, preventing reactive obstacle/battery checks from ticking!',
              'It returns `RUNNING` automatically',
              'It resets the Blackboard',
            ],
            correctIndex: 1,
            explanation:
              'BT ticks are synchronous and must return quickly! Long-running actions should inherit from `BT::StatefulActionNode` or `RosActionNode` and return `BT::NodeStatus::RUNNING` until finished.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit_6',
    number: 6,
    title: 'Gazebo, ros2_control, MoveIt 2 & Real-Time C++',
    description:
      'Achieve sim-to-real parity with ros2_control C++ plugins, plan 6-DOF arm trajectories with MoveIt 2, and write PREEMPT_RT-safe C++.',
    color: 'cyan',
    badgeName: 'Principal Robotics Architect',
    nodes: [
      {
        id: 'u6_n1',
        unitId: 'unit_6',
        title: 'Gazebo Sim & ros2_control C++ Hardware Interface',
        subtitle: 'Sim-to-real parity via hardware_interface::SystemInterface',
        kind: 'lesson',
        estimatedMinutes: 10,
        xpReward: 70,
        keyTakeaways: [
          '`ros_gz_bridge` translates Gazebo Transport topics (`/clock`, `/scan`, `/cmd_vel`) into ROS 2 topics.',
          '`ros2_control` runs a real-time loop: `read()` hardware state -> `controller_manager->update()` -> `write()` hardware commands.',
          'Swap `gz_ros2_control` (simulation) for a real EtherCAT/CAN `SystemInterface` C++ plugin with zero changes to controllers or Nav2!',
        ],
        deepDive: [
          {
            title: '1. The ros2_control C++ Real-Time Loop',
            body: 'In production C++ robotics, you don’t subscribe to `/cmd_vel` inside a motor driver node with unbounded latency. Instead, `controller_manager` owns a single high-priority real-time loop calling `hardware->read(time, period)`, updating `diff_drive_controller` / `joint_trajectory_controller`, and calling `hardware->write(time, period)`.',
          },
        ],
        exercises: [
          {
            id: 'u6_n1_e1',
            type: 'multiple-choice',
            prompt:
              'Why does `ros2_control` separate Controllers (`diff_drive_controller`) from `hardware_interface::SystemInterface` C++ plugins?',
            options: [
              'So the exact same controller binaries and YAML configs run unmodified in Gazebo CI simulation and on physical CAN/EtherCAT hardware',
              'Because Gazebo only supports Python controllers',
              'To replace DDS with HTTP',
              'To bypass URDF files',
            ],
            correctIndex: 0,
            explanation:
              'Command and State interfaces abstract hardware registers into `double*` memory handles, guaranteeing true sim-to-real parity.',
          },
        ],
      },
      {
        id: 'u6_n2',
        unitId: 'unit_6',
        title: 'MoveIt 2 C++ API & Real-Time C++ Hygiene',
        subtitle: 'Inverse Kinematics, OMPL motion planning, PREEMPT_RT & MCAP bags',
        kind: 'boss',
        estimatedMinutes: 12,
        xpReward: 100,
        keyTakeaways: [
          'Forward Kinematics (FK) maps joint angles `q -> end-effector pose`; Inverse Kinematics (IK) solves `target pose -> valid joint angles q` (often multiple solutions or unreachable).',
          'MoveIt 2 (`moveit::planning_interface::MoveGroupInterface` in C++) queries OMPL planners (RRTConnect) against a collision `PlanningScene`.',
          'In 1 kHz real-time C++ (`PREEMPT_RT`), NEVER allocate heap memory (`new`/`std::vector::push_back`), log synchronously, or block on mutexes — use pre-allocated buffers & lock-free SPSC queues (`realtime_tools::RealtimeBox`).',
        ],
        deepDive: [
          {
            title: '1. Real-Time C++ Rules for Robotics Control Loops',
            body: 'As a C++ developer, this is where your systems mastery shines: a single `malloc` page fault or `std::mutex` contention in a 1 kHz `ros2_control::write()` loop causes a missed deadline and actuator jitter. Pre-allocate all `std::vector` capacities in `on_configure()`, lock memory with `mlockall`, and bridge non-RT ROS subscribers to the RT loop using `realtime_tools::RealtimeBuffer` or lock-free ring buffers.',
          },
        ],
        exercises: [
          {
            id: 'u6_n2_e1',
            type: 'spot-the-bug',
            prompt:
              'During a 1 kHz `PREEMPT_RT` `ros2_control::write()` cycle, your joint trajectory intermittently jitters by 4 ms. Spot the real-time C++ violation:',
            codeSnippet: `hardware_interface::return_type write(const rclcpp::Time &, const rclcpp::Duration &) override {
  std::vector<double> cmds;
  for (auto val : hw_commands_) cmds.push_back(val); // <-- inside 1kHz RT loop
  can_bus_.send(cmds);
  return hardware_interface::return_type::OK;
}`,
            language: 'cpp',
            options: [
              '`std::vector<double> cmds` + `push_back()` allocates heap memory inside the deterministic 1 kHz RT loop',
              'hw_commands_ must be floats',
              'return_type::OK causes a deadlock',
              'CAN bus cannot run at 1 kHz',
            ],
            correctIndex: 0,
            explanation:
              'Heap allocation (`malloc`/`new`) acquires allocator locks and can trigger OS page faults, breaking real-time determinism. Pre-allocate fixed-size `std::array` or reserve a member `std::vector` in `on_init()`/`on_configure()`.',
          },
          {
            id: 'u6_n2_e2',
            type: 'architecture-tradeoff',
            prompt:
              'You replay a `.mcap` rosbag (`ros2 bag play run.mcap`) to debug your C++ EKF node, and TF2 throws timestamp errors because node clocks use wall time (2026) while the bag was recorded in 2025. Fix?',
            options: [
              'Run `ros2 bag play run.mcap --clock` AND launch your C++ node with `use_sim_time:=true`',
              'Recompile the C++ node with `-O3`',
              'Set `ROS_DOMAIN_ID=0`',
              'Convert `.mcap` to CSV',
            ],
            correctIndex: 0,
            explanation:
              '`--clock` publishes `/clock` from the bag timestamps, and `use_sim_time:=true` makes `this->get_clock()->now()` track `/clock` deterministically.',
          },
        ],
      },
    ],
  },
];

export function getAllNodes() {
  return CURRICULUM_UNITS.flatMap((u) => u.nodes);
}
