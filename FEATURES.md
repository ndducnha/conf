# Vcyber - Advanced Features Guide

Complete guide to all the advanced features available in Vcyber video conferencing platform.

---

## 🎨 Core Features

### ✅ Custom Branding
- **Logo-Aligned Color Scheme**: Cyan (#00d4ff) → Blue (#0066ff) → Purple (#a855f7) gradient
- **Dark Navy Background**: Professional dark theme (#0a1628)
- **Consistent Theming**: CSS variables ensure uniform colors across all components
- **Visual Indicators**: Color-coded buttons (Chat=Blue, Recording=Red, Invite=Green, Participants=Purple)
- Vcyber logo and branding throughout the app
- Professional, modern interface

### 📹 HD Video Conferencing
- Powered by LiveKit infrastructure
- Multiple participants support
- Screen sharing capabilities
- Adaptive video quality

---

## 💬 Enhanced Chat with File Sharing

### Features:
- **Text Messaging**: Real-time chat with all participants
- **Smart Notifications**:
  - 🟢 **Pulsing cyan dot** indicator on Menu and Chat buttons when new messages arrive
  - 🔴 **Red badge** showing unread message count
  - **Window focus detection**: Notifications only appear when window is blurred (not actively viewing)
  - **Rate limiting**: Max 1 notification per sender every 3 seconds (prevents spam)
- **File Sharing**: Send files up to 15MB directly in chat
- **File Types**: Support for all file types
- **Download Buttons**: Received files can be downloaded with one click

### Notification Indicators:
- **☰ Menu Button**:
  - Pulsing cyan dot appears when unread messages exist
  - Red badge shows total count (unread messages + waiting participants)
- **💬 Chat Button** (in menu):
  - Pulsing cyan dot appears when unread messages exist
  - Red badge shows unread message count
- **Toast Notifications**: Only shown when window is not focused (prevents duplicate alerts)

### How to Use:
1. Click the **☰ Menu** button during a meeting (look for pulsing cyan dot for new messages)
2. Click **💬 Chat** to open the chat panel
3. Type your message or click **📎** to attach a file
4. Files are sent instantly to all participants (chunked for reliability)
5. Click **⬇ Download** button below received files to save them
6. When you open chat, all indicators reset (messages marked as read)

### Limitations:
- Maximum file size: 15MB
- Files are transferred peer-to-peer using chunked transfer
- Files are not stored on server, only in memory during session
- Ensure stable connection for large files

---

## 👥 Participant Management (Host Controls)

### Waiting Room Feature

**What it does:**
- First person to join becomes the host
- Host can approve or deny new participants
- Prevents unwanted interruptions

**How it works:**
1. First person joins automatically as host
2. Additional participants automatically send join request
3. Participants see "Waiting for host approval..." screen
4. Host receives toast notification and sees requests in Participant Manager
5. Host can approve (participant joins) or deny (participant is disconnected)

### Kick Member Functionality

**Host can:**
- View all active participants
- Remove disruptive participants instantly
- Maintain control of the meeting

**How to use:**
1. Click **👥 Manage** button (top-right, host only)
2. View list of all participants
3. Click **Kick** next to any participant
4. Participant is immediately disconnected from the room

### Interface:
- **Waiting Room Section**: Shows pending join requests
- **Active Participants**: Shows current participants
- **Host Badge**: "You - Host" indicator
- **Quick Actions**: Approve/Deny/Kick buttons

---

## 🎥 Recording Controls

### Features:
- **Start Recording**: Begin recording the meeting
- **Pause Recording**: Temporarily pause without stopping
- **Resume Recording**: Continue from where you paused
- **Stop & Save**: End recording and save to server

### How to Use Recording:

#### Starting a Recording:
1. Click the **🎥 Record** button (bottom-right)
2. Click **● Start Recording**
3. Recording indicator appears (pulsing red dot)
4. All participants are notified

#### During Recording:
- **Pause**: Click **⏸ Pause** to temporarily stop
- **Resume**: Click **▶ Resume** to continue
- **Stop**: Click **■ Stop & Save** to end and save

#### Recording Status:
- **Recording**: Pulsing red indicator
- **Paused**: Orange status indicator
- **Idle**: Gray button

### Recording Storage:
- Recordings saved to `/public/recordings/` directory
- Each recording has unique ID
- Metadata includes: room name, start time, end time, duration
- Accessible via `/recordings` page

---

## 📊 Recordings Page

### Access Recordings:
Visit: `http://your-domain.com/recordings`

### Features:
- **List View**: All recordings sorted by date (newest first)
- **Metadata**: Room name, date, duration, status
- **Status Badges**: Visual indicators for recording status
- **Search & Filter**: (Coming soon)

### Recording Information:
Each recording shows:
- Room name
- Recording date and time
- Duration (if completed)
- Status (recording/paused/completed)
- Unique recording ID

---

## 🔗 Quick Invite

### Feature:
- One-click room link copying
- Share meeting links instantly

### How to Use:
1. Click **Invite** button (top-right in meeting)
2. Room URL copied to clipboard automatically
3. Paste and share with participants
4. Success notification confirms copy

---

## 🎯 User Interface Elements

### Room Layout:

**Top Bar:**
- Left: Vcyber logo and branding
- Right: Invite button
- Right (Host only): Manage Participants button

**Bottom Bar:**
- Left: Chat toggle button
- Right: Recording controls button
- Center: Standard LiveKit controls (mic, camera, screen share)

**Side Panel:**
- Chat panel (toggleable)
- File sharing interface
- Message history

---

## 🔒 Security & Privacy

### Data Handling:
- **Files**: Transferred peer-to-peer, not stored on server
- **Chat**: Messages stored in memory only (not persisted)
- **Recordings**: Stored locally on server (configure storage location)
- **E2EE**: End-to-end encryption support available

### Host Controls:
- Waiting room prevents unauthorized access
- Kick functionality removes disruptive participants
- First-join-host model ensures meeting control

---

## 📱 Responsive Design

All features work seamlessly on:
- ✅ Desktop browsers
- ✅ Tablet devices
- ✅ Mobile browsers (with responsive adjustments)

---

## 🆘 Troubleshooting

### File Sharing Issues:
- **File too large**: Maximum 15MB limit
- **Transfer failed**: Check internet connection
- **File not received**: Ensure both parties are connected
- **Download button missing**: Received files show download button below chat messages

### Recording Issues:
- **Can't start recording**: Check server permissions
- **Recording not saved**: Verify `/public/recordings/` exists and is writable
- **No recording button**: May require host permissions

### Participant Management:
- **Can't kick**: Only host can manage participants
- **Waiting room not working**: Ensure data channels are enabled
- **Not recognized as host**: First person to join is host

---

## 🚀 Coming Soon

Planned features for future releases:
- [ ] Recording playback in-browser
- [ ] Download recordings
- [ ] Export chat history
- [ ] Custom waiting room messages
- [ ] Participant hand-raise feature
- [ ] Breakout rooms
- [ ] Screen annotation tools

---

## 💡 Best Practices

### For Hosts:
1. Join first to become host
2. Enable waiting room for sensitive meetings
3. Start recording at beginning if needed
4. Monitor participant manager regularly
5. Use kick feature sparingly

### For Participants:
1. Wait for host approval if waiting room is enabled
2. Keep files under 15MB for reliable transfer
3. Use download buttons to save received files
4. Respect recording indicators
5. Use chat for quick communications

### For Recording:
1. Inform participants before recording
2. Test recording before important meetings
3. Stop and save promptly to avoid data loss
4. Regularly clean up old recordings

---

## 🔧 Technical Details

### File Transfer Protocol:
- Uses LiveKit data channels
- Base64 encoding for binary data
- Topic: `file-transfer`
- Reliable delivery mode

### Participant Control:
- Data channel messages for signaling
- Topics: `waiting-room-request`, `waiting-room-response`, `participant-control`
- Host identified by join timestamp

### Recording System:
- API endpoints: `/api/recording/start`, `/api/recording/stop`, `/api/recording/list`
- Metadata storage: JSON files
- Directory: `public/recordings/`

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for setup issues
3. Check LiveKit documentation: https://docs.livekit.io
4. Review GitHub issues

---

**Enjoy your enhanced Vcyber video conferencing experience!** 🎉
