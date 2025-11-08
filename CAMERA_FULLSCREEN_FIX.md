# Camera & Fullscreen Badge Fixes + Settings Integration

## ✅ Issues Fixed

### 1. **Camera & Fullscreen Badges Not Working**
**Problem**: Badges were display-only, not clickable
**Solution**: Added click handlers to enable/disable camera and fullscreen

### 2. **Camera Always Active**
**Problem**: Camera started automatically for all users
**Solution**: Added user preference toggle in settings

### 3. **No Settings Control**
**Problem**: No way to control camera proctoring
**Solution**: Added toggle in Test Preferences section

---

## 🎯 Changes Made

### 1. Settings - Camera Preference Toggle

**File**: `src/components/settings/TestPreferences.tsx`

#### Added New Preference
```typescript
interface TestPreferences {
  autoSubmitOnTimeExpiry?: boolean
  showCorrectAnswersImmediately?: boolean
  defaultDifficulty?: 'easy' | 'medium' | 'hard'
  enableQuestionReviewMode?: boolean
  enableCameraProctoring?: boolean  // ✅ NEW
}
```

#### Default Value
```typescript
const defaultPreferences: TestPreferences = {
  autoSubmitOnTimeExpiry: true,
  showCorrectAnswersImmediately: false,
  defaultDifficulty: 'medium',
  enableQuestionReviewMode: true,
  enableCameraProctoring: false,  // ✅ Disabled by default
}
```

#### UI Toggle
```typescript
enableCameraProctoring: {
  label: 'Enable Camera Proctoring',
  description: 'Use camera for test monitoring and security (camera will be active throughout the test)',
  icon: Camera,
}
```

**Location**: Dashboard → Settings → Test Preferences

---

### 2. Test Interface - Camera Respect Preference

**File**: `src/components/test/TestAttemptInterface.tsx`

#### Before
```typescript
// Camera always started automatically
useEffect(() => {
  const enableCamera = async () => {
    // Always tries to enable camera
  }
  enableCamera()
}, [])
```

#### After
```typescript
// Camera respects user preference
useEffect(() => {
  const cameraPreference = userProfile?.test_preferences?.enableCameraProctoring ?? false
  
  if (!cameraPreference) {
    console.log('Camera proctoring disabled by user preference')
    return  // ✅ Exit if disabled
  }

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Enable camera...
    } catch (err) {
      toast.error('Camera access denied. Please enable camera in settings.')
    }
  }

  enableCamera()
}, [userProfile])
```

---

### 3. Interactive Camera Badge

**File**: `src/components/test/TestAttemptInterface.tsx`

#### Before
```tsx
<Badge variant={cameraEnabled ? 'default' : 'destructive'}>
  <Camera className="mr-1 h-3 w-3" />
  Camera
</Badge>
```

#### After
```tsx
{userProfile?.test_preferences?.enableCameraProctoring && (
  <Badge 
    variant={cameraEnabled ? 'default' : 'destructive'}
    className="cursor-pointer"
    onClick={async () => {
      if (!cameraEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraEnabled(true)
            setProctoringFlags((prev) => ({ ...prev, camera_enabled: true }))
            toast.success('Camera enabled')
          }
        } catch (err) {
          toast.error('Failed to enable camera. Please check permissions.')
        }
      }
    }}
  >
    <Camera className="mr-1 h-3 w-3" />
    Camera
  </Badge>
)}
```

**Features**:
- ✅ Only shows if camera proctoring is enabled in settings
- ✅ Clickable to enable camera if disabled
- ✅ Shows toast notification on success/failure
- ✅ Visual feedback (cursor-pointer)

---

### 4. Interactive Fullscreen Badge

#### Before
```tsx
<Badge variant={isFullscreen ? 'default' : 'destructive'}>
  <Maximize className="mr-1 h-3 w-3" />
  Fullscreen
</Badge>
```

#### After
```tsx
<Badge 
  variant={isFullscreen ? 'default' : 'destructive'}
  className="cursor-pointer"
  onClick={async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        setProctoringFlags((prev) => ({ ...prev, fullscreen_active: true }))
        toast.success('Fullscreen enabled')
      } catch (err) {
        toast.error('Failed to enable fullscreen. Please try manually pressing F11.')
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }}
>
  <Maximize className="mr-1 h-3 w-3" />
  Fullscreen
</Badge>
```

**Features**:
- ✅ Clickable to toggle fullscreen
- ✅ Shows toast notification on success/failure
- ✅ Can exit fullscreen by clicking again
- ✅ Fallback instructions (F11)

---

### 5. Enhanced Camera Feed Display

**File**: `src/components/test/TestAttemptInterface.tsx`

#### Before
```tsx
{cameraEnabled && (
  <div className="mt-4">
    <p className="mb-2 text-xs text-gray-400">Proctoring Camera</p>
    <video
      ref={videoRef}
      autoPlay
      muted
      className="w-full rounded-lg border border-gray-700"
    />
  </div>
)}
```

#### After
```tsx
{cameraEnabled && userProfile?.test_preferences?.enableCameraProctoring && (
  <div className="mt-4">
    <p className="mb-2 text-xs text-muted-foreground">Proctoring Camera</p>
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  </div>
)}
```

**Features**:
- ✅ Only shows if preference is enabled
- ✅ **LIVE indicator** with pulsing dot
- ✅ Proper aspect ratio (16:9)
- ✅ Theme-aware colors
- ✅ Better video fit (object-cover)
- ✅ Mobile-friendly (playsInline)
- ✅ Professional appearance

---

## 📍 Camera Feed Location

**Position**: Right sidebar of `/test/[testId]/attempt` page

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Header (Timer, Badges)                              │
├──────────────────────────────┬──────────────────────┤
│                              │  Stats               │
│                              │  ✓ Answered: 5       │
│  Question Content            │  ⚑ Marked: 2         │
│  Options                     │  ○ Unanswered: 8     │
│  Navigation                  │                      │
│                              │  Question Grid       │
│                              │  [1][2][3][4][5]     │
│                              │                      │
│                              │  ┌────────────────┐  │
│                              │  │ LIVE  🔴       │  │
│                              │  │                │  │
│                              │  │  Camera Feed   │  │ ← HERE
│                              │  │                │  │
│                              │  └────────────────┘  │
│                              │                      │
│                              │  Violations          │
└──────────────────────────────┴──────────────────────┘
```

---

## 🎮 User Flow

### Enable Camera Proctoring

1. **Go to Settings**
   - Navigate to Dashboard
   - Click Settings in sidebar
   - Go to "Test" section

2. **Enable Toggle**
   - Find "Enable Camera Proctoring"
   - Toggle switch ON
   - Preference saves automatically

3. **Start Test**
   - Camera starts automatically
   - Camera badge shows green (enabled)
   - Camera feed appears in sidebar
   - LIVE indicator shows recording

### Disable Camera Proctoring

1. **Go to Settings**
   - Navigate to Settings → Test

2. **Disable Toggle**
   - Toggle "Enable Camera Proctoring" OFF
   - Preference saves automatically

3. **Start Test**
   - No camera request
   - Camera badge not shown
   - No camera feed in sidebar

### Manual Camera Control During Test

**If camera fails or is disabled:**
1. Click the **Camera badge** in header
2. Browser prompts for camera permission
3. Allow camera access
4. Camera feed appears
5. Toast shows "Camera enabled"

**If fullscreen exits:**
1. Click the **Fullscreen badge** in header
2. Browser enters fullscreen
3. Badge turns green
4. Toast shows "Fullscreen enabled"

---

## 🎨 Visual Indicators

### Badge States

#### Camera Badge
- **Green (Default)**: Camera active and working
- **Red (Destructive)**: Camera disabled or failed
- **Cursor**: Pointer (clickable)
- **Action**: Click to enable if disabled

#### Fullscreen Badge
- **Green (Default)**: In fullscreen mode
- **Red (Destructive)**: Not in fullscreen
- **Cursor**: Pointer (clickable)
- **Action**: Click to toggle fullscreen

### Camera Feed
- **Border**: 2px theme-aware border
- **Aspect Ratio**: 16:9 (standard video)
- **LIVE Indicator**: 
  - Red background
  - White text
  - Pulsing white dot
  - Top-right corner
- **Position**: Right sidebar, below question grid

---

## 🔒 Privacy & Security

### User Control
- ✅ Camera is **OFF by default**
- ✅ User must **explicitly enable** in settings
- ✅ Clear indication when camera is active
- ✅ Can see camera feed at all times
- ✅ No hidden recording

### Permissions
- ✅ Browser permission required
- ✅ User can deny camera access
- ✅ Graceful error handling
- ✅ Clear error messages

### Data
- ✅ Video stream stays local (not uploaded)
- ✅ Used only for proctoring detection
- ✅ Stops when test ends
- ✅ No recording to server (unless implemented separately)

---

## 📱 Responsive Design

### Desktop
- Camera feed in right sidebar
- Full 16:9 aspect ratio
- LIVE indicator clearly visible

### Tablet
- Camera feed in sidebar
- Slightly smaller but still visible
- All controls accessible

### Mobile
- Camera feed in sidebar (if space allows)
- `playsInline` attribute prevents fullscreen video
- Touch-friendly badge buttons

---

## 🧪 Testing Checklist

### Settings
- [ ] Navigate to Settings → Test
- [ ] Find "Enable Camera Proctoring" toggle
- [ ] Toggle ON - saves automatically
- [ ] Toggle OFF - saves automatically
- [ ] Refresh page - preference persists

### Test with Camera Enabled
- [ ] Enable camera in settings
- [ ] Start a test
- [ ] Camera badge shows in header (green if working)
- [ ] Camera feed appears in sidebar
- [ ] LIVE indicator is visible and pulsing
- [ ] Video shows your face
- [ ] Complete test - camera stops

### Test with Camera Disabled
- [ ] Disable camera in settings
- [ ] Start a test
- [ ] No camera badge in header
- [ ] No camera feed in sidebar
- [ ] No camera permission request
- [ ] Test works normally

### Manual Camera Control
- [ ] Start test with camera disabled
- [ ] Camera badge shows red (if enabled in settings)
- [ ] Click camera badge
- [ ] Browser asks for permission
- [ ] Allow camera
- [ ] Badge turns green
- [ ] Camera feed appears
- [ ] Toast shows "Camera enabled"

### Fullscreen Control
- [ ] Start test
- [ ] Fullscreen badge shows red initially
- [ ] Click fullscreen badge
- [ ] Browser enters fullscreen
- [ ] Badge turns green
- [ ] Toast shows "Fullscreen enabled"
- [ ] Click badge again
- [ ] Exits fullscreen
- [ ] Badge turns red

### Error Handling
- [ ] Deny camera permission
- [ ] Toast shows error message
- [ ] Badge stays red
- [ ] Test continues normally
- [ ] Click badge again to retry

---

## 🎉 Summary

### What Works Now

1. ✅ **Camera Badge is Clickable**
   - Click to enable camera if disabled
   - Shows toast notifications
   - Visual feedback

2. ✅ **Fullscreen Badge is Clickable**
   - Click to toggle fullscreen
   - Shows toast notifications
   - Can exit fullscreen

3. ✅ **Settings Integration**
   - Toggle in Test Preferences
   - Saves automatically
   - Persists across sessions

4. ✅ **Camera Respects Preference**
   - Only starts if enabled in settings
   - No automatic camera access
   - User has full control

5. ✅ **Professional Camera Feed**
   - LIVE indicator with pulsing dot
   - Proper aspect ratio
   - Theme-aware styling
   - Right sidebar position
   - Active throughout test

### User Benefits

- 🎯 **Control**: Full control over camera usage
- 🔒 **Privacy**: Camera off by default
- 👁️ **Transparency**: Always see when camera is active
- ⚡ **Quick Fix**: Click badges to fix issues
- 📱 **Responsive**: Works on all devices
- 🎨 **Professional**: Clean, modern UI

All requested features implemented successfully! 🚀
