# RoboDojo — Robotics & ROS 2 Mastery for C++ & Python Developers

A Duolingo-inspired, in-depth interactive web app tailored for **experienced C++ (and Python) developers who are new to robotics**, structured around **30-minute daily sessions** and inspired by **The Construct's** C++ robotics progression (`ROS 2 Basics (C++)` → `Intermediate ROS 2 (C++)` → `URDF/TF2` → `Control & EKF` → `Nav2` → `Gazebo, ros2_control & MoveIt 2`).

## Features

- **In-Depth First-Principles Study Cards + C++ Systems Bridges**: Every node starts with multi-card conceptual deep dives translating physical robotics (control loops, frames, quaternions, kinematics, Kalman covariance, configuration space) into C++ systems mental models (`std::shared_ptr`, `std::unique_ptr`, `ament_cmake`, `BehaviorTree.CPP`, `PREEMPT_RT`).
- **Winding Skill Path (6 Units, 17 Deep Nodes)**:
  1. **Robotics First Principles & ROS 2 C++ Core** — Sense → Plan → Act, multi-rate loops, `ament_cmake`/`colcon`, `rclcpp` QoS RxO, `MultiThreadedExecutor` & zero-copy `std::unique_ptr` composition
  2. **Pub/Sub, Actions, Params & Lifecycle (C++)** — Async `rclcpp` futures, `rclcpp_action` preemption, `rclcpp_lifecycle::LifecycleNode`
  3. **3D Geometry, URDF & TF2 Transforms** — REP-103/105 frames, Quaternions vs Euler gimbal lock, URDF inertia tensors, `tf2_ros::Buffer` & `tf2::doTransform`
  4. **Kinematics, PID Control & Sensor Fusion** — Diff-drive unicycle kinematics, PID + conditional integration anti-windup, EKF covariance & `robot_localization`
  5. **SLAM, Path Planning & Nav2 (C++)** — Occupancy Grids, C-space inflation, MPPI, `BehaviorTree.CPP` custom C++ nodes
  6. **Gazebo, `ros2_control`, MoveIt 2 & Real-Time C++** — `hardware_interface::SystemInterface`, MoveIt 2 OMPL, `PREEMPT_RT` zero-allocation loops, MCAP rosbags
- **Daily 30-Minute Workout**: Guided 3-part daily session with a live 30:00 countdown timer.
- **4 Interactive Simulators**:
  - **Diff-Drive Kinematics, LiDAR Raycaster & Odometry Drift Lab**
  - **QoS Compatibility Matrix**
  - **TF2 & 2D Kinematics Matrix Visualizer**
  - **PID Controller Step-Response Lab**
- **8 Hands-On Code Labs**: `rclcpp` QoS watchdog, `MultiThreadedExecutor` deadlock fix, `rclcpp_lifecycle` node, `Python .launch.py` + `ComposableNodeContainer`, `URDF/Xacro`, `tf2_ros` C++ listener, `Nav2` costmap YAML, and `BehaviorTree.CPP` C++ condition node.
- **ROS 2 CLI Dojo**: Simulated terminal supporting `colcon build --symlink-install`, `ros2 doctor`, `ros2 component types`, `ros2 topic info --verbose`, `ros2 param set`, `ros2 lifecycle get`, and `tf2_tools view_frames`.

## Local Development

```bash
npm install
npm run dev
```
