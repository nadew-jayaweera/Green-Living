# Green Living 🌿

A modern, full-stack Next.js application dedicated to promoting sustainability and community engagement through tree planting. Users can track their contributions, earn badges, and share their green journey with a like-minded community.

## 🚀 Live Demo
**Check it out here**: [https://green-living-sand.vercel.app/](https://green-living-sand.vercel.app/)

> [!NOTE]
> This link is a **frontend sandbox demo**. Real-time backend features (database, auth, image storage) are not functional in this preview.

## ✅ Recent Updates (This Branch)

### 🌓 Dark Mode & Themability
- **Persistent Dark Mode**: System-aware dark mode that saves preferences to `localStorage`, preventing FOUC (Flash of Unstyled Content).
- **Theme Consistency**: polished spacing, contrast, and color variables across all pages (Admin, Profile, Forum, Upload) for a seamless experience in both light and dark modes.
- **Glassmorphism UI**: Enhanced sidebar transparency and card backgrounds for a premium, modern aesthetic.

### ✨ Quality of Life Features
- **Toast Notifications**: Replaced intrusive alerts with a non-blocking, beautiful toast notification system for success/error messages.
- **Smart Image Uploads**: Added drag-and-drop support and client-side image compression to optimize performance and user experience.
- **Location Auto-fill**: integrated Geolocation API to automatically fetch and fill the city/state in the upload form.
- **Back to Top**: Added a smooth-scrolling "Back to Top" button for easy navigation on long pages.
- **Mobile Responsiveness**: Fixed layout issues to ensure a perfect experience on mobile devices.

### 🧹 Codebase Health
- **Cleanup**: Removed unused components (`AdminSidebar`), legacy scripts, and boilerplate assets to streamline the project.
- **Optimization**: improved project structure and removed redundant dependencies.

### 🌍 Global Forest Feed & Social Interaction
- **Community Feed**: A new "Global Forest" page displaying all user-uploaded trees in a sleek card layout.
- **Engagement System**: Users can now "Like" posts with optimistic UI updates for instant feedback.
- **Sidebar Overhaul**: Replaced standard icons with a custom nature-themed set and added a dynamic "Admin" link for authorized users.

### 🛡️ Professional Admin Dashboard
- **Content Moderation**: Centralized panel to approve, reject, or delete plant uploads to ensure platform quality.
- **User Management**: Ability for main admins to promote/demote users to admin status and manage the community list.
- **Platform Analytics**: Real-time stats for total users, uploads, and pending review counts.

### 🛠️ Robust System Improvements
- **Upload Fail-safes**: Improved image processing logic with an automatic fallback to base64 if compression or external storage fails.
- **Auto-Approval**: Implemented self-approval logic for a smoother user experience during the early community phase.
- **Badge Automation**: Integrated automatic badge checks after every upload, awarding achievements like "Seed Starter" instantly.

## 🤝 Contributing

We welcome contributions! Whether it's fixing bugs, improving documentation, or proposing new features, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
