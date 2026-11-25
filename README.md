# RoboDojo — Robotics & ROS 2 Mastery

A Duolingo-inspired, gamified web application designed for **experienced software developers** to learn **Robotics, ROS 2, DDS, TF2, Control Theory, SLAM, Nav2, and MoveIt 2** in focused **30-minute daily sessions**.

## Features

- **Winding Skill Path (6 Units)**:
  1. **ROS 2 Architecture & DDS** — Nodes, RTPS discovery, `ROS_DOMAIN_ID`, Composable Nodes, QoS RxO compatibility, `MultiThreadedExecutor` & Callback Groups
  2. **Pub/Sub, Services, Actions & Lifecycle** — IPC selection, Action state machines, Managed `LifecycleNode`
  3. **URDF, Xacro & TF2 Transforms** — REP-103/105 frames, `tf2_ros.Buffer` lookups & extrapolation guards
  4. **Control, Kinematics & State Estimation** — PID tuning with anti-windup, diff-drive kinematics, `robot_localization` EKF
  5. **Perception, SLAM & Nav2** — Costmaps, inflation layers, MPPI/Smac planners, BehaviorTree.CPP
  6. **Simulation, MoveIt 2 & Production** — Gazebo Sim (`ros_gz_bridge`), `ros2_control`, MoveIt 2, Rosbag2 (MCAP)
- **Daily 30-Minute Workout**: Guided 3-part daily plan (10m concept + 10m simulator/CLI + 10m code assignment) with a live 30:00 timer.
- **Interactive Simulators**:
  - **QoS Compatibility Matrix** (Publisher vs Subscriber RxO diagnostics)
  - **TF2 & 2D Kinematics Visualizer** (live `SE(2)` homogeneous transformation matrix)
  - **PID Controller Step-Response Lab** (real-time curve, overshoot, rise time, steady-state error, anti-windup & load disturbance)
- **ROS 2 Code Labs**: Hands-on `rclpy`, `URDF/Xacro`, and `Nav2 YAML` coding assignments with automated verification tests and reference solutions.
- **ROS 2 CLI Dojo**: Simulated `ros2` terminal (`node list`, `topic info --verbose`, `param set`, `lifecycle get`, `view_frames`) with diagnostic missions.
- **Gamification**: XP, Ranks, Streaks, Daily Quests, Badges, Web Audio feedback, and **Senior Engineer Mode** (unlimited hearts + open unit access).

## Local Development

```bash
npm install
npm run dev
```
