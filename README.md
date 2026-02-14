# Green Living - Smart Home Energy Management System

A comprehensive web application for monitoring and managing household energy consumption using IoT devices. This system helps users reduce electricity bills and promote sustainable living through real-time data, smart scheduling, and AI-powered recommendations.

## 🚀 Features

### 📊 Real-Time Monitoring
- **Live Dashboard**: Track current power consumption, voltage, and current in real-time.
- **Device Status**: Monitor the online/offline status of all connected IoT devices.
- **Historical Data**: View energy usage patterns with interactive charts.

### 💡 Smart Automation
- **Device Control**: Remotely turn appliances ON/OFF.
- **Scheduling**: Set schedules for devices to operate automatically (e.g., turn on geyser at 6 PM).
- **Timer Control**: Set specific durations for device operation.

### 🤖 AI & Analytics
- **Consumption Prediction**: Predict future energy usage based on historical data.
- **Anomaly Detection**: Identify unusual spikes in consumption that may indicate issues.
- **Personalized Tips**: Receive AI-generated recommendations to save energy.

### 👤 User Management
- **Secure Authentication**: Email/password login with JWT-based session management.
- **Profile Management**: Update user details and preferences.
- **Role-Based Access**: Support for different user roles (Admin, User).

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: Express.js
- **Language**: JavaScript
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Bcrypt.js

### IoT Integration
- **Protocol**: MQTT
- **Broker**: Mosquitto (Local)
- **Devices**: ESP32 (Simulated)

## 📂 Project Structure

```
Green-Living/
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Login, etc.)
│   │   ├── services/      # API service layer
│   │   ├── contexts/      # React Context for state management
│   │   └── App.js         # Main application component
│   └── package.json
│
├── server/                # Express.js Backend
│   ├── config/            # Database and environment configuration
│   ├── controllers/       # Request handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic and external services
│   └── server.js          # Application entry point
│
├── .env                   # Environment variables (not in git)
├── package.json           # Root project dependencies
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- MQTT Broker (e.g., Mosquitto)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Green-Living
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

Create a `.env` file in the `server/` directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/greenliving
JWT_SECRET=your_jwt_secret
MQTT_HOST=localhost
MQTT_PORT=1883
```

### Running the Application

1. **Start the Backend**
   ```bash
   cd server
   npm run dev
   ```
   The server will start on `http://localhost:5000`.

2. **Start the Frontend**
   ```bash
   cd ../client
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`.

3. **Access the App**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔌 IoT Device Integration

The system uses MQTT for real-time communication between IoT devices and the backend.

### MQTT Topics
- **Publish (Device → Server)**: `home/device/status`
- **Subscribe (Server → Device)**: `home/device/control`

### Simulated Device
In the `client/src/services/mqttService.js` file, we simulate an ESP32 device for testing purposes. You can replace this with actual ESP32 code that publishes data to the MQTT broker.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.