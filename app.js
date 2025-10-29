// State Management
const state = {
  firstVisit: true,
  achievements: [],
  idleTimer: null,
  idleTime: 0,
  windows: {},
  highestZIndex: 100,
  clickCount: {},
  clickTimer: {},
  isDragging: false,
  draggedWindow: null,
  dragOffset: { x: 0, y: 0 },
  visualizerActive: false,
  paintActive: false,
  currentTool: 'pencil',
  isDrawing: false,
  konamiCode: [],
  konamiPattern: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
  clippyClicks: 0,
  startButtonClicks: 0,
  startButtonClickTimer: null,
  minesweeperTimer: null,
  minesweeperTime: 0,
  calcValue: '0',
  calcOperation: null,
  calcPrevious: null,
  cmdHistory: []
};

// Startup Sequence
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('boot-screen').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
    
    // Play startup sound
    playStartupSound();
    
    setTimeout(() => {
      document.getElementById('welcome-screen').classList.add('hidden');
      document.getElementById('desktop').classList.remove('hidden');
      initializeApp();
    }, 2000);
  }, 2000);
});

function playStartupSound() {
  // Play a short Windows-like chord using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const master = audioContext.createGain();
  master.connect(audioContext.destination);
  master.gain.setValueAtTime(0.15, audioContext.currentTime);

  const notes = [392.00, 523.25, 659.25]; // G4, C5, E5
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(master);
    const start = audioContext.currentTime + i * 0.02;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
    osc.start(start);
    osc.stop(start + 0.65);
  });
}

// Initialize Application
function initializeApp() {
  updateClock();
  setInterval(updateClock, 1000);
  
  initializeDesktopIcons();
  initializeWindows();
  initializeStartMenu();
  initializePaint();
  initializeMediaPlayer();
  initializeGallery();
  initializeContactForm();
  initializeRestart();
  initializeMinesweeper();
  initializeCalculator();
  initializeCommandPrompt();
  initializeClippy();
  initializeEasterEggs();
  initializeKeyboardShortcuts();
  initializeNotepad();
  initializeHelpWindow();
  showWelcomeDialog();
  initializeAchievements();
  initializeIdleDetection();
  initializeTooltips();
  unlockAchievement('first-visit', '🎉 First Visit', 'Welcome to the portfolio!');
}

// Clock
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  document.getElementById('clock').textContent = `${displayHours}:${displayMinutes} ${ampm}`;
}

// Desktop Icons - Double Click
function initializeDesktopIcons() {
  const icons = document.querySelectorAll('.desktop-icon');
  
  icons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      const iconId = icon.getAttribute('data-window');
      
      // Clear other selections
      icons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
      
      // Track clicks for double-click
      if (!state.clickCount[iconId]) {
        state.clickCount[iconId] = 0;
      }
      
      state.clickCount[iconId]++;
      
      if (state.clickCount[iconId] === 1) {
        state.clickTimer[iconId] = setTimeout(() => {
          state.clickCount[iconId] = 0;
        }, 300);
      } else if (state.clickCount[iconId] === 2) {
        clearTimeout(state.clickTimer[iconId]);
        state.clickCount[iconId] = 0;
        
        // Double click detected - open window
        if (iconId && iconId !== 'null') {
          openWindow(iconId);
        }
      }
    });
  });
  
  // Click outside to deselect
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (!e.target.closest('.desktop-icon') && !e.target.closest('.window') && !e.target.closest('.start-menu') && !e.target.closest('.taskbar')) {
      icons.forEach(i => i.classList.remove('selected'));
    }
  });
}

// Initialize Windows
function initializeWindows() {
  const windows = document.querySelectorAll('.window');
  
  windows.forEach(window => {
    const windowId = window.id;
    state.windows[windowId] = {
      element: window,
      isMaximized: false,
      originalPosition: null,
      originalSize: null
    };
    
    // Titlebar dragging
    const titlebar = window.querySelector('.window-titlebar');
    titlebar.addEventListener('mousedown', startDrag.bind(null, windowId));
    
    // Window controls
    const minimizeBtn = window.querySelector('.btn-minimize');
    const maximizeBtn = window.querySelector('.btn-maximize');
    const closeBtn = window.querySelector('.btn-close');
    
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(windowId);
    });
    
    maximizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize(windowId);
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(windowId);
    });
    
    // Focus on click
    window.addEventListener('mousedown', () => {
      focusWindow(windowId);
    });
  });
  
  // Global mouse events for dragging
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
}

// Open Window
function openWindow(windowId) {
  const window = state.windows[windowId];
  if (!window) return;
  
  window.element.classList.remove('hidden');
  
  // Track window opens for achievements
  const openedWindows = Object.values(state.windows).filter(w => !w.element.classList.contains('hidden')).length;
  if (openedWindows >= 5) {
    unlockAchievement('multitasker', '🪟 Multitasker', 'Opened 5 windows at once!');
  }
  
  // Center window if first time opening
  if (!window.originalPosition) {
    const desktop = document.getElementById('desktop');
    const rect = window.element.getBoundingClientRect();
    const x = (desktop.clientWidth - rect.width) / 2;
    const y = (desktop.clientHeight - rect.height - 30) / 2; // Account for taskbar
    
    window.element.style.left = x + 'px';
    window.element.style.top = y + 'px';
  }
  
  focusWindow(windowId);
  addTaskbarButton(windowId);
}

// Close Window
function closeWindow(windowId) {
  const window = state.windows[windowId];
  if (!window) return;
  
  window.element.classList.add('hidden');
  removeTaskbarButton(windowId);
}

// Minimize Window
function minimizeWindow(windowId) {
  const window = state.windows[windowId];
  if (!window) return;
  
  window.element.classList.add('hidden');
  
  // Keep taskbar button but make it inactive
  const button = document.querySelector(`[data-window-id="${windowId}"]`);
  if (button) {
    button.classList.remove('active');
  }
}

// Toggle Maximize
function toggleMaximize(windowId) {
  const window = state.windows[windowId];
  if (!window) return;
  
  if (window.isMaximized) {
    // Restore
    window.element.classList.remove('maximized');
    if (window.originalPosition) {
      // Clear edge constraints
      window.element.style.right = '';
      window.element.style.bottom = '';
      window.element.style.left = window.originalPosition.left;
      window.element.style.top = window.originalPosition.top;
      window.element.style.width = window.originalSize.width;
      window.element.style.height = window.originalSize.height;
    }
    window.isMaximized = false;
  } else {
    // Maximize
    const rect = window.element.getBoundingClientRect();
    const desktop = document.getElementById('desktop');
    const taskbarHeight = 30;

    // Store computed values so restore works even if inline styles were empty
    window.originalPosition = {
      left: `${rect.left}px`,
      top: `${rect.top}px`
    };
    window.originalSize = {
      width: `${rect.width}px`,
      height: `${rect.height}px`
    };

    window.element.classList.add('maximized');
    // Snap to desktop bounds: stretch edge-to-edge
    window.element.style.left = '0px';
    window.element.style.top = '0px';
    window.element.style.right = '0px';
    window.element.style.bottom = `${taskbarHeight}px`;
    // Let CSS handle width/height; clear explicit sizes to avoid stale values
    window.element.style.width = '';
    window.element.style.height = '';
    window.isMaximized = true;
  }
}

// Focus Window
function focusWindow(windowId) {
  state.highestZIndex++;
  const window = state.windows[windowId];
  if (!window) return;
  
  // Remove active state from all windows
  Object.values(state.windows).forEach(w => {
    w.element.classList.remove('active');
    w.element.classList.add('inactive');
  });
  
  // Set active state
  window.element.classList.add('active');
  window.element.classList.remove('inactive');
  window.element.style.zIndex = state.highestZIndex;
  
  // Update taskbar buttons
  document.querySelectorAll('.window-button').forEach(btn => {
    btn.classList.remove('active');
  });
  const button = document.querySelector(`[data-window-id="${windowId}"]`);
  if (button) {
    button.classList.add('active');
  }
}

// Drag Functions
function startDrag(windowId, e) {
  // Don't drag if clicking on buttons
  if (e.target.closest('.window-controls')) return;
  
  const window = state.windows[windowId];
  if (!window || window.isMaximized) return;
  
  state.isDragging = true;
  state.draggedWindow = windowId;
  
  const rect = window.element.getBoundingClientRect();
  state.dragOffset.x = e.clientX - rect.left;
  state.dragOffset.y = e.clientY - rect.top;
  
  focusWindow(windowId);
  e.preventDefault();
}

function handleDrag(e) {
  if (!state.isDragging || !state.draggedWindow) return;
  
  const window = state.windows[state.draggedWindow];
  if (!window) return;
  
  const desktop = document.getElementById('desktop');
  const rect = window.element.getBoundingClientRect();
  
  let x = e.clientX - state.dragOffset.x;
  let y = e.clientY - state.dragOffset.y;
  
  // Constrain to desktop bounds
  x = Math.max(0, Math.min(x, desktop.clientWidth - rect.width));
  y = Math.max(0, Math.min(y, desktop.clientHeight - rect.height - 30)); // Account for taskbar
  
  window.element.style.left = x + 'px';
  window.element.style.top = y + 'px';
}

function stopDrag() {
  state.isDragging = false;
  state.draggedWindow = null;
}

// Taskbar Buttons
function addTaskbarButton(windowId) {
  const existing = document.querySelector(`[data-window-id="${windowId}"]`);
  if (existing) {
    existing.classList.add('active');
    return;
  }
  
  const window = state.windows[windowId];
  const button = document.createElement('button');
  button.className = 'window-button active';
  button.setAttribute('data-window-id', windowId);
  
  const icon = window.element.querySelector('.window-icon').textContent;
  const title = window.element.querySelector('.window-title span:last-child').textContent;
  
  button.innerHTML = `<span>${icon}</span><span>${title}</span>`;
  
  button.addEventListener('click', () => {
    if (window.element.classList.contains('hidden')) {
      window.element.classList.remove('hidden');
      focusWindow(windowId);
    } else if (window.element.classList.contains('active')) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  });
  
  document.getElementById('window-buttons').appendChild(button);
}

function removeTaskbarButton(windowId) {
  const button = document.querySelector(`[data-window-id="${windowId}"]`);
  if (button) {
    button.remove();
  }
}

// Start Menu
function initializeStartMenu() {
  const startButton = document.getElementById('start-button');
  const startMenu = document.getElementById('start-menu');
  
  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    startMenu.classList.toggle('hidden');
    startButton.classList.toggle('active');
  });
  
  // Close start menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
      startMenu.classList.add('hidden');
      startButton.classList.remove('active');
    }
  });
  
  // Menu items
  const menuItems = startMenu.querySelectorAll('.menu-item[data-window]');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const windowId = item.getAttribute('data-window');
      openWindow(windowId);
      startMenu.classList.add('hidden');
      startButton.classList.remove('active');
    });
  });
  
  // Quick launch icons
  const quickLaunchIcons = document.querySelectorAll('.quick-launch .taskbar-icon');
  quickLaunchIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const windowId = icon.getAttribute('data-window');
      openWindow(windowId);
    });
  });
}

// Paint Application
function initializePaint() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const colorPicker = document.getElementById('paint-color');
  const clearBtn = document.getElementById('clear-canvas');
  const tools = document.querySelectorAll('.paint-tool');
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  
  tools.forEach(tool => {
    tool.addEventListener('click', () => {
      tools.forEach(t => t.classList.remove('active'));
      tool.classList.add('active');
      state.currentTool = tool.getAttribute('data-tool');
    });
  });
  
  canvas.addEventListener('mousedown', (e) => {
    state.isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!state.isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (state.currentTool === 'pencil') {
      ctx.strokeStyle = colorPicker.value;
      ctx.lineWidth = 2;
    } else if (state.currentTool === 'eraser') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 10;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  });
  
  canvas.addEventListener('mouseup', () => {
    state.isDrawing = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    state.isDrawing = false;
  });
  
  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

// Media Player with Web Audio API
function initializeMediaPlayer() {
  const canvas = document.getElementById('visualizer-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const seekBar = document.getElementById('seek-bar');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');
  const vizMenu = document.getElementById('viz-menu');
  const vizMenuItems = document.querySelectorAll('.viz-menu-item');
  
  let audioContext = null;
  let mediaSource = null;
  let gainNode = null;
  let analyser = null;
  let animationId = null;
  let currentVisualization = 'bars';
  let startTime = 0;
  let currentTime = 0;
  let duration = 0;
  let isPlaying = false;
  let updateInterval = null;
  const audioSrc = 'media/starboy.mp3'; // place your mp3 here
  const audioEl = new Audio();
  audioEl.src = audioSrc;
  audioEl.preload = 'auto';
  
  // Initialize Audio Context
  function initAudioContext() {
    if (audioContext) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    gainNode = audioContext.createGain();
    mediaSource = audioContext.createMediaElementSource(audioEl);
    mediaSource.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    gainNode.gain.value = 0.5;
  }
  
  // Format time
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Update time display
  function updateTime() {
    if (!isPlaying) return;
    currentTime = audioEl.currentTime || 0;
    duration = audioEl.duration || duration;
    timeCurrent.textContent = formatTime(currentTime);
    if (duration && isFinite(duration)) {
      seekBar.value = (currentTime / duration) * 100;
    }
  }
  
  // Visualizations
  function drawBars(dataArray, bufferLength) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#0058E7');
      gradient.addColorStop(0.5, '#3A95FF');
      gradient.addColorStop(1, '#7DB8FF');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
      x += barWidth;
    }
  }
  
  function drawOcean(dataArray, bufferLength) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.strokeStyle = '#00CED1';
    ctx.lineWidth = 2;
    
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = v * canvas.height / 2 + canvas.height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    ctx.stroke();
  }
  
  function drawAlchemy(dataArray, bufferLength) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < bufferLength; i += 4) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = (dataArray[i] / 255) * 20;
      
      const hue = (dataArray[i] / 255) * 360;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  function drawScope(dataArray, bufferLength) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  
  function drawBattery(dataArray, bufferLength) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 3;
    
    for (let i = 0; i < 5; i++) {
      const avg = dataArray.slice(i * 10, (i + 1) * 10).reduce((a, b) => a + b, 0) / 10;
      const radius = (avg / 255) * maxRadius;
      
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${200 + i * 30}, 100%, 50%)`;
      ctx.lineWidth = 3;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  function animate() {
    if (!isPlaying) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    switch (currentVisualization) {
      case 'bars':
        drawBars(dataArray, bufferLength);
        break;
      case 'ocean':
        drawOcean(dataArray, bufferLength);
        break;
      case 'alchemy':
        drawAlchemy(dataArray, bufferLength);
        break;
      case 'scope':
        drawScope(dataArray, bufferLength);
        break;
      case 'battery':
        drawBattery(dataArray, bufferLength);
        break;
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  function stopAudio() {
    isPlaying = false;
    audioEl.pause();
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    playBtn.innerHTML = '▶️';
  }
  
  // Event Listeners
  playBtn.addEventListener('click', async () => {
    if (!audioContext) initAudioContext();
    if (!isPlaying) {
      try {
        await audioEl.play();
        isPlaying = true;
        animate();
        updateInterval = setInterval(updateTime, 200);
        playBtn.innerHTML = '⏸️';
      } catch (e) {
        alert('Please place starboy.mp3 at media/starboy.mp3 or click to allow audio.');
      }
    } else {
      audioEl.pause();
      isPlaying = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (updateInterval) clearInterval(updateInterval);
      playBtn.innerHTML = '▶️';
    }
  });
  
  stopBtn.addEventListener('click', () => {
    stopAudio();
    audioEl.currentTime = 0;
    currentTime = 0;
    timeCurrent.textContent = '0:00';
    seekBar.value = 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  
  volumeSlider.addEventListener('input', (e) => {
    if (gainNode) {
      gainNode.gain.value = e.target.value / 100;
    }
  });
  
  seekBar.addEventListener('input', (e) => {
    if (!duration) return;
    const t = (e.target.value / 100) * duration;
    audioEl.currentTime = t;
    currentTime = t;
    timeCurrent.textContent = formatTime(currentTime);
  });
  
  // Right-click context menu for visualizations
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    vizMenu.style.left = (e.offsetX + 10) + 'px';
    vizMenu.style.top = (e.offsetY + 10) + 'px';
    vizMenu.classList.toggle('hidden');
  });
  
  vizMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      currentVisualization = item.getAttribute('data-viz');
      vizMenu.classList.add('hidden');
    });
  });
  
  // Initialize time display
  audioEl.addEventListener('loadedmetadata', () => {
    duration = audioEl.duration;
    timeTotal.textContent = isFinite(duration) ? formatTime(duration) : '0:00';
  });
  audioEl.addEventListener('ended', () => {
    stopAudio();
  });
  timeTotal.textContent = '0:00';
  timeCurrent.textContent = '0:00';
}

// Contact Form
function initializeContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show success message (since we can't actually send email from client-side)
    const formData = new FormData(form);
    const name = formData.get('name');
    
    alert(`Thank you ${name}! Your message has been received. I'll get back to you soon!`);
    form.reset();
  });
}

// Photo Gallery
function initializeGallery() {
  const galleryGrid = document.getElementById('gallery-grid');
  const categoryItems = document.querySelectorAll('.category-item');
  const photoViewer = document.getElementById('photo-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerFilename = document.getElementById('viewer-filename');
  const viewerClose = document.getElementById('viewer-close');
  const viewerPrev = document.getElementById('viewer-prev');
  const viewerNext = document.getElementById('viewer-next');
  const galleryStatus = document.getElementById('gallery-status');
  
  let currentPhotoIndex = 0;
  let currentCategory = 'all';
  
  // Photo data
  const photos = [
    { name: 'AEROWAVE - Helmet Prototype V1', category: 'projects', placeholder: true, color: '#4A90E2', desc: 'Initial prototype design' },
    { name: 'AEROWAVE - Circuit Design', category: 'projects', placeholder: true, color: '#7B68EE', desc: 'ESP32 circuit board' },
    { name: 'AEROWAVE - Testing Phase', category: 'projects', placeholder: true, color: '#27AE60', desc: 'Real-world testing' },
    { name: 'AEROWAVE - Final Assembly', category: 'projects', placeholder: true, color: '#E67E22', desc: 'Production model' },
    { name: 'WATCHDOG - Full System', category: 'projects', placeholder: true, color: '#E74C3C', desc: 'Complete defense system' },
    { name: 'WATCHDOG - Thermal Camera Setup', category: 'projects', placeholder: true, color: '#C0392B', desc: 'IR imaging module' },
    { name: 'WATCHDOG - Control Interface', category: 'projects', placeholder: true, color: '#8E44AD', desc: 'GUI dashboard' },
    { name: 'PROSTIFY - Prosthetic Arm', category: 'projects', placeholder: true, color: '#16A085', desc: 'Myoelectric arm' },
    { name: 'PROSTIFY - Sensor Array', category: 'projects', placeholder: true, color: '#27AE60', desc: 'EMG sensors' },
    { name: 'BMS - Battery Pack Setup', category: 'projects', placeholder: true, color: '#F39C12', desc: '4x12V configuration' },
    { name: 'Disaster Management - Sensors', category: 'projects', placeholder: true, color: '#3498DB', desc: 'Water level monitoring' },
    { name: 'Chatbot - UI Design', category: 'projects', placeholder: true, color: '#9B59B6', desc: 'Next.js interface' },
    { name: 'Arduino Test Kit', category: 'projects', placeholder: true, color: '#34495E', desc: 'Diagnostic tool' },
    { name: 'Workspace - Main Setup', category: 'workspace', url: 'https://pplx-res.cloudinary.com/image/upload/v1755800990/pplx_project_search_images/400181fe6ee860d38e3a03fd3fcf9b669caa38b9.png' },
    { name: 'Workspace - Arduino Station', category: 'workspace', placeholder: true, color: '#2C3E50', desc: 'ESP32 development' },
    { name: 'Workspace - Electronics Bench', category: 'workspace', placeholder: true, color: '#7F8C8D', desc: 'Testing area' },
    { name: 'Workspace - Coding Setup', category: 'workspace', url: 'https://pplx-res.cloudinary.com/image/upload/v1754891555/pplx_project_search_images/00e2273a0e2b475b5c91c4015315cfece0af9e01.png' },
    { name: 'IC3IA 2025 Conference', category: 'events', placeholder: true, color: '#E74C3C', desc: 'Paper presentation' },
    { name: 'Springer Publication Event', category: 'events', placeholder: true, color: '#3498DB', desc: 'Research recognition' },
    { name: 'FKCCI Manthan 2024', category: 'events', placeholder: true, color: '#F39C12', desc: 'Top 10 pitch' },
    { name: 'Times of India Feature', category: 'events', placeholder: true, color: '#E67E22', desc: 'Media coverage' },
    { name: 'Patent Certificate - AeroWave', category: 'achievements', placeholder: true, color: '#D4AF37', desc: '🏆 IPO Patent' },
    { name: 'Springer Publication Certificate', category: 'achievements', placeholder: true, color: '#4A90E2', desc: '📚 Chapter 6' },
    { name: 'MSME Grant Award', category: 'achievements', placeholder: true, color: '#9C27B0', desc: '💰 ₹16.5L' },
    { name: 'Times of India Article', category: 'achievements', placeholder: true, color: '#FF9800', desc: '📰 Feature' },
    { name: 'FKCCI Top 10 Certificate', category: 'achievements', placeholder: true, color: '#C0C0C0', desc: '🥉 Finalist' },
    { name: 'UAS Design Patent', category: 'achievements', placeholder: true, color: '#607D8B', desc: '✈️ Filed' }
  ];

  // Append real project and achievement images from provided data
  [
    // AEROWAVE images
    { n: 'AEROWAVE - v1', c: 'projects', u: 'images/portfolio/aerowave/v1.jpg' },
    { n: 'AEROWAVE - v2', c: 'projects', u: 'images/portfolio/aerowave/v2.jpg' },
    { n: 'AEROWAVE - v3', c: 'projects', u: 'images/portfolio/aerowave/v3.jpg' },
    { n: 'AEROWAVE - p3', c: 'projects', u: 'images/portfolio/aerowave/p3.jpg' },
    { n: 'AEROWAVE - p4', c: 'projects', u: 'images/portfolio/aerowave/p4.jpg' },
    { n: 'AEROWAVE - p5', c: 'projects', u: 'images/portfolio/aerowave/p5.jpg' },
    { n: 'AEROWAVE - p6', c: 'projects', u: 'images/portfolio/aerowave/p6.jpg' },
    // WATCHDOG images
    { n: 'WATCHDOG - p1', c: 'projects', u: 'images/portfolio/ads/p1.jpg' },
    { n: 'WATCHDOG - p2', c: 'projects', u: 'images/portfolio/ads/p2.jpg' },
    { n: 'WATCHDOG - p3', c: 'projects', u: 'images/portfolio/ads/p3.jpg' },
    { n: 'WATCHDOG - p4', c: 'projects', u: 'images/portfolio/ads/p4.jpg' },
    { n: 'WATCHDOG - p5', c: 'projects', u: 'images/portfolio/ads/p5.jpg' },
    { n: 'WATCHDOG - p6', c: 'projects', u: 'images/portfolio/ads/p6.jpg' },
    { n: 'WATCHDOG - p7', c: 'projects', u: 'images/portfolio/ads/p7.jpg' },
    // Disaster Management images
    { n: 'Disaster - p1', c: 'projects', u: 'images/portfolio/disaster/p1.jpg' },
    { n: 'Disaster - p2', c: 'projects', u: 'images/portfolio/disaster/p2.jpg' },
    { n: 'Disaster - p3', c: 'projects', u: 'images/portfolio/disaster/p3.jpg' },
    // Chatbot image
    { n: 'Chatbot - p1', c: 'projects', u: 'images/portfolio/chatbot/p1.jpg' },
    // Keyboard with Gesture image
    { n: 'Keyboard - p1', c: 'projects', u: 'images/portfolio/key/p1.jpg' },
    // Arduino Test Kit image
    { n: 'Arduino Test Kit - p1', c: 'projects', u: 'images/portfolio/testkit/p1.jpg' },
    // Pose Detection image
    { n: 'Pose Detection - p1', c: 'projects', u: 'images/portfolio/pose/p1.jpg' },
    // Rock-Paper-Scissors images
    { n: 'RPS - p1', c: 'projects', u: 'images/portfolio/rock/p1.jpg' },
    { n: 'RPS - p2', c: 'projects', u: 'images/portfolio/rock/p2.jpg' },
    // Eye Controlled Mouse image
    { n: 'Eye Mouse - p1', c: 'projects', u: 'images/portfolio/mouse/p1.jpg' },
    // Mail Dispatcher images
    { n: 'Mail Dispatcher - p1', c: 'projects', u: 'images/portfolio/mail/p1.jpg' },
    { n: 'Mail Dispatcher - p2', c: 'projects', u: 'images/portfolio/mail/p2.jpg' },
    // BMS image
    { n: 'BMS - p1', c: 'projects', u: 'images/portfolio/bms/p1.jpg' },
    // PROSTIFY images
    { n: 'PROSTIFY - p1', c: 'projects', u: 'images/portfolio/prostify/p1.jpg' },
    { n: 'PROSTIFY - p2', c: 'projects', u: 'images/portfolio/prostify/p2.jpg' },
    { n: 'PROSTIFY - p3', c: 'projects', u: 'images/portfolio/prostify/p3.jpg' },
    { n: 'PROSTIFY - p4', c: 'projects', u: 'images/portfolio/prostify/p4.jpg' },
    { n: 'PROSTIFY - p5', c: 'projects', u: 'images/portfolio/prostify/p5.jpg' },
    { n: 'PROSTIFY - p6', c: 'projects', u: 'images/portfolio/prostify/p6.jpg' },
    // Hostel Management images
    { n: 'Hostel - p1', c: 'projects', u: 'images/portfolio/hostel/p1.jpg' },
    { n: 'Hostel - p2', c: 'projects', u: 'images/portfolio/hostel/p2.jpg' },
    { n: 'Hostel - p3', c: 'projects', u: 'images/portfolio/hostel/p3.jpg' },
    { n: 'Hostel - p4', c: 'projects', u: 'images/portfolio/hostel/p4.jpg' },
    // Home Automation image
    { n: 'Home Automation - p1', c: 'projects', u: 'images/portfolio/home/p1.jpg' },
    // Flight Stabilizer image
    { n: 'Flight Stabilizer - p1', c: 'projects', u: 'images/portfolio/flight/p1.jpg' },
    // Achievements images
    { n: 'IC3IA 2025', c: 'achievements', u: 'images/portfolio/aaa/p2.jpg' },
    { n: 'MSME Grant', c: 'achievements', u: 'images/portfolio/aaa/p5.jpg' },
    { n: 'Times of India', c: 'achievements', u: 'images/portfolio/aaa/p6.jpg' },
    { n: 'AeroWave Patent', c: 'achievements', u: 'images/portfolio/aaa/v2.jpg' },
    { n: 'UAS Design Patent', c: 'achievements', u: 'images/portfolio/aaa/p4.jpg' },
    { n: 'FKCCI Manthan 2024', c: 'achievements', u: 'images/portfolio/aaa/p1.jpg' }
  ].forEach(p => photos.push({ name: p.n, category: p.c, url: p.u }));
  
  function createPlaceholder(photo) {
    const div = document.createElement('div');
    div.className = 'gallery-thumbnail';
    div.style.background = photo.color || '#ccc';
    div.style.color = '#fff';
    div.style.fontSize = '11px';
    div.style.fontWeight = 'bold';
    div.style.padding = '10px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.textAlign = 'center';
    div.textContent = photo.name;
    return div;
  }
  
  function renderGallery() {
    galleryGrid.innerHTML = '';
    
    const filteredPhotos = currentCategory === 'all' 
      ? photos 
      : photos.filter(p => p.category === currentCategory);
    
    filteredPhotos.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('data-index', photos.indexOf(photo));
      
      if (photo.placeholder) {
        item.appendChild(createPlaceholder(photo));
      } else {
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = photo.name;
        img.className = 'gallery-thumbnail';
        img.style.width = '180px';
        img.style.height = '135px';
        img.style.objectFit = 'cover';
        item.appendChild(img);
      }
      
      const filename = document.createElement('div');
      filename.className = 'gallery-filename';
      filename.textContent = photo.name;
      item.appendChild(filename);
      
      if (photo.desc) {
        const desc = document.createElement('div');
        desc.style.fontSize = '9px';
        desc.style.color = '#666';
        desc.style.marginTop = '2px';
        desc.textContent = photo.desc;
        item.appendChild(desc);
      }
      
      // Double-click to open viewer
      let clickTimeout = null;
      let clickCount = 0;
      
      item.addEventListener('click', () => {
        clickCount++;
        
        if (clickCount === 1) {
          clickTimeout = setTimeout(() => {
            clickCount = 0;
            // Single click - select
            document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
          }, 300);
        } else if (clickCount === 2) {
          clearTimeout(clickTimeout);
          clickCount = 0;
          // Double click - open viewer
          openViewer(photos.indexOf(photo));
        }
      });
      
      galleryGrid.appendChild(item);
    });
    
    galleryStatus.textContent = `${filteredPhotos.length} picture${filteredPhotos.length !== 1 ? 's' : ''}`;
  }
  
  function openViewer(index) {
    currentPhotoIndex = index;
    updateViewer();
    photoViewer.classList.remove('hidden');
  }
  
  function updateViewer() {
    const photo = photos[currentPhotoIndex];
    
    if (photo.placeholder) {
      // Show placeholder in viewer
      viewerImage.style.display = 'none';
      const placeholder = createPlaceholder(photo);
      placeholder.style.width = '600px';
      placeholder.style.height = '450px';
      placeholder.style.fontSize = '24px';
      placeholder.style.margin = '0 auto';
      
      const container = document.querySelector('.viewer-image-container');
      container.innerHTML = '';
      container.appendChild(placeholder);
    } else {
      viewerImage.src = photo.url;
      viewerImage.alt = photo.name;
      viewerImage.style.display = 'block';
    }
    
    viewerTitle.textContent = `Image ${currentPhotoIndex + 1} of ${photos.length}`;
    viewerFilename.textContent = photo.name;
  }
  
  function closeViewer() {
    photoViewer.classList.add('hidden');
  }
  
  function prevPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    updateViewer();
  }
  
  function nextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
    updateViewer();
  }
  
  // Event Listeners
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      categoryItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentCategory = item.getAttribute('data-category');
      renderGallery();
    });
  });
  
  viewerClose.addEventListener('click', closeViewer);
  viewerPrev.addEventListener('click', prevPhoto);
  viewerNext.addEventListener('click', nextPhoto);
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!photoViewer.classList.contains('hidden')) {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    }
  });
  
  // Click outside to close
  photoViewer.addEventListener('click', (e) => {
    if (e.target === photoViewer) {
      closeViewer();
    }
  });
  
  // Initial render
  renderGallery();
}

// Minesweeper Game
function initializeMinesweeper() {
  const grid = document.getElementById('minesweeper-grid');
  const counter = document.getElementById('mine-counter');
  const timer = document.getElementById('mine-timer');
  const smiley = document.getElementById('smiley-btn');
  
  if (!grid) return;
  
  let rows = 9, cols = 9, mines = 10;
  let board = [];
  let revealed = [];
  let flagged = [];
  let gameOver = false;
  
  function initBoard() {
    board = [];
    revealed = [];
    flagged = [];
    gameOver = false;
    state.minesweeperTime = 0;
    
    if (state.minesweeperTimer) clearInterval(state.minesweeperTimer);
    
    grid.style.gridTemplateColumns = `repeat(${cols}, 24px)`;
    grid.innerHTML = '';
    
    // Create empty board
    for (let i = 0; i < rows * cols; i++) {
      board.push(false);
      revealed.push(false);
      flagged.push(false);
    }
    
    // Place mines
    let placed = 0;
    while (placed < mines) {
      const pos = Math.floor(Math.random() * rows * cols);
      if (!board[pos]) {
        board[pos] = true;
        placed++;
      }
    }
    
    // Create cells
    for (let i = 0; i < rows * cols; i++) {
      const cell = document.createElement('div');
      cell.className = 'mine-cell';
      cell.dataset.index = i;
      
      cell.addEventListener('click', () => revealCell(i));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(i);
      });
      
      grid.appendChild(cell);
    }
    
    updateCounter();
    timer.textContent = '000';
    smiley.textContent = '🙂';
  }
  
  function getNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          neighbors.push(nr * cols + nc);
        }
      }
    }
    return neighbors;
  }
  
  function countAdjacentMines(index) {
    return getNeighbors(index).filter(n => board[n]).length;
  }
  
  function revealCell(index) {
    if (gameOver || revealed[index] || flagged[index]) return;
    
    // Start timer on first click
    if (state.minesweeperTime === 0) {
      state.minesweeperTimer = setInterval(() => {
        state.minesweeperTime++;
        timer.textContent = String(state.minesweeperTime).padStart(3, '0');
      }, 1000);
    }
    
    revealed[index] = true;
    const cell = grid.children[index];
    cell.classList.add('revealed');
    
    if (board[index]) {
      // Hit a mine!
      cell.classList.add('mine');
      gameOver = true;
      smiley.textContent = '😵';
      clearInterval(state.minesweeperTimer);
      
      // Reveal all mines
      setTimeout(() => {
        board.forEach((isMine, i) => {
          if (isMine && i !== index) {
            grid.children[i].classList.add('mine', 'revealed');
          }
        });
      }, 500);
      return;
    }
    
    const adjacent = countAdjacentMines(index);
    if (adjacent > 0) {
      cell.textContent = adjacent;
      const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
      cell.style.color = colors[adjacent];
    } else {
      // Reveal neighbors
      getNeighbors(index).forEach(n => revealCell(n));
    }
    
    // Check win
    checkWin();
  }
  
  function toggleFlag(index) {
    if (gameOver || revealed[index]) return;
    
    flagged[index] = !flagged[index];
    const cell = grid.children[index];
    
    if (flagged[index]) {
      cell.classList.add('flagged');
    } else {
      cell.classList.remove('flagged');
    }
    
    updateCounter();
  }
  
  function updateCounter() {
    const flagCount = flagged.filter(f => f).length;
    counter.textContent = String(mines - flagCount).padStart(3, '0');
  }
  
  function checkWin() {
    const allNonMinesRevealed = revealed.every((r, i) => r || board[i]);
    if (allNonMinesRevealed) {
      gameOver = true;
      smiley.textContent = '😎';
      clearInterval(state.minesweeperTimer);
      setTimeout(() => {
        alert('🎉 You won! Great job!');
      }, 200);
    }
  }
  
  smiley.addEventListener('click', initBoard);
  
  // Track Minesweeper usage
  const minesweeperWindow = document.getElementById('minesweeper-window');
  const mineObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!minesweeperWindow.classList.contains('hidden')) {
          unlockAchievement('minesweeper', '💣 Minesweeper Player', 'Started playing Minesweeper!');
        }
      }
    });
  });
  
  mineObserver.observe(minesweeperWindow, { attributes: true });
  
  initBoard();
}

// Solitaire Game (simplified)
// (Solitaire removed)

// Calculator
function initializeCalculator() {
  const display = document.getElementById('calc-display');
  const buttons = document.querySelectorAll('.calc-btn');
  const calcWindow = document.getElementById('calc-window');
  
  if (!display) return;
  
  // Keyboard support
  calcWindow.addEventListener('keydown', (e) => {
    e.preventDefault();
    
    if (e.key >= '0' && e.key <= '9') {
      handleCalcInput(e.key);
    } else if (e.key === '.') {
      handleCalcInput('.');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      handleCalcOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      handleCalcEquals();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      handleCalcClear();
    } else if (e.key === 'Backspace') {
      handleCalcBackspace();
    }
  });
  
  // Make calculator focusable
  calcWindow.tabIndex = 0;
  
  // Auto-focus when opened
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!calcWindow.classList.contains('hidden')) {
          setTimeout(() => calcWindow.focus(), 100);
          unlockAchievement('calc-opened', '🔢 Calculator User', 'Opened the calculator!');
        }
      }
    });
  });
  
  observer.observe(calcWindow, { attributes: true });
  
  function handleCalcInput(value) {
    if (state.calcValue === '0' || state.calcValue === 'Error') {
      state.calcValue = value;
    } else {
      state.calcValue += value;
    }
    display.textContent = state.calcValue;
  }
  
  function handleCalcOperation(op) {
    if (state.calcOperation && state.calcPrevious !== null) {
      calculate();
    }
    state.calcPrevious = parseFloat(state.calcValue);
    state.calcOperation = op;
    state.calcValue = '0';
  }
  
  function handleCalcEquals() {
    calculate();
    display.textContent = state.calcValue;
  }
  
  function handleCalcClear() {
    state.calcValue = '0';
    state.calcOperation = null;
    state.calcPrevious = null;
    display.textContent = state.calcValue;
  }
  
  function handleCalcBackspace() {
    state.calcValue = state.calcValue.slice(0, -1) || '0';
    display.textContent = state.calcValue;
  }
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const op = btn.dataset.op;
      const action = btn.dataset.action;
      
      if (value !== undefined) {
        if (state.calcValue === '0' || state.calcValue === 'Error') {
          state.calcValue = value;
        } else {
          state.calcValue += value;
        }
      } else if (op) {
        if (state.calcOperation && state.calcPrevious !== null) {
          calculate();
        }
        state.calcPrevious = parseFloat(state.calcValue);
        state.calcOperation = op;
        state.calcValue = '0';
      } else if (action === 'equals') {
        calculate();
      } else if (action === 'clear') {
        state.calcValue = '0';
        state.calcOperation = null;
        state.calcPrevious = null;
      } else if (action === 'backspace') {
        state.calcValue = state.calcValue.slice(0, -1) || '0';
      }
      
      // Easter egg: 42
      if (state.calcValue === '42') {
        display.textContent = '42 (The Answer!)';
        unlockAchievement('calc-42', '🤖 Meaning of Life', 'Found the answer: 42!');
        setTimeout(() => {
          alert('🎉 42 - The Answer to Life, the Universe, and Everything!\n\n(From "The Hitchhiker\'s Guide to the Galaxy")');
        }, 500);
        return;
      }
      
      display.textContent = state.calcValue;
    });
  });
  
  function calculate() {
    if (state.calcOperation === null || state.calcPrevious === null) return;
    
    const current = parseFloat(state.calcValue);
    let result;
    
    switch (state.calcOperation) {
      case '+':
        result = state.calcPrevious + current;
        break;
      case '-':
        result = state.calcPrevious - current;
        break;
      case '*':
        result = state.calcPrevious * current;
        break;
      case '/':
        result = current === 0 ? 'Error' : state.calcPrevious / current;
        break;
    }
    
    state.calcValue = String(result);
    state.calcOperation = null;
    state.calcPrevious = null;
  }
}

// Command Prompt
function initializeCommandPrompt() {
  const output = document.getElementById('cmd-output');
  const input = document.getElementById('cmd-input');
  const cmdWindow = document.getElementById('cmd-window');
  
  if (!input) return;
  
  // Make CMD focusable
  cmdWindow.tabIndex = 0;
  
  // Auto-focus when opened
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!cmdWindow.classList.contains('hidden')) {
          setTimeout(() => input.focus(), 100);
          unlockAchievement('cmd-opened', '💻 Command Line Pro', 'Opened Command Prompt!');
        }
      }
    });
  });
  
  observer.observe(cmdWindow, { attributes: true });
  
  const commands = {
    help: 'Available commands:\ndir - List directory\ncd - Change directory\ncls - Clear screen\necho - Print text\nver - Show version\ncolor - Change colors\ntree - Show directory tree\nipconfig - Network info\nwhoami - Current user\nhack - Try to hack (just kidding!)\nbliss - Change wallpaper',
    dir: 'Directory of C:\\Documents and Settings\\Sathwik\n\nMy Documents\nMy Pictures\nDesktop\nProjects\n     4 Dir(s)  1,337,420,069 bytes free',
    ver: 'Microsoft Windows XP [Version 5.1.2600]\nSathwik Portfolio Edition',
    whoami: 'C:\\Documents and Settings\\Sathwik',
    cls: 'CLEAR',
    ipconfig: 'Windows IP Configuration\n\nEthernet adapter Local Area Connection:\n   IP Address: 192.168.1.42\n   Subnet Mask: 255.255.255.0\n   Default Gateway: 192.168.1.1',
    tree: 'Projects\n├── AEROWAVE\n├── WATCHDOG\n├── PROSTIFY\n└── Portfolio'
  };
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim().toLowerCase();
      const displayCmd = input.value.trim();
      
      output.textContent += displayCmd + '\n';
      
      // Easter eggs
      if (cmd === 'hack') {
        output.textContent += '\n[HACKING INITIATED]\n';
        unlockAchievement('cmd-hack', '🔐 Hacker Wannabe', 'Tried to hack the system!');
        setTimeout(() => {
          output.textContent += 'Accessing mainframe...\n';
          setTimeout(() => {
            output.textContent += 'Decrypting files...\n';
            setTimeout(() => {
              output.textContent += 'Bypassing firewall...\n';
              setTimeout(() => {
                output.textContent += '\nACCESS DENIED.\nNice try! 😄\n\n';
                output.textContent += 'C:\\Documents and Settings\\Sathwik>';
                output.scrollTop = output.scrollHeight;
              }, 800);
            }, 1000);
          }, 800);
        }, 500);
        input.value = '';
        return;
      }
      
      if (cmd.startsWith('color ')) {
        const color = cmd.split(' ')[1];
        if (color === 'a') {
          document.querySelector('.cmd-content').style.color = '#0F0';
          output.textContent += 'Matrix mode activated!\n\n';
        }
        output.textContent += 'C:\\Documents and Settings\\Sathwik>';
      } else if (cmd.startsWith('echo ')) {
        output.textContent += cmd.substring(5) + '\n\n';
        output.textContent += 'C:\\Documents and Settings\\Sathwik>';
      } else if (commands[cmd]) {
        if (cmd === 'cls') {
          output.textContent = 'Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright 1985-2001 Microsoft Corp.\n\nC:\\Documents and Settings\\Sathwik>';
        } else {
          output.textContent += commands[cmd] + '\n\n';
          output.textContent += 'C:\\Documents and Settings\\Sathwik>';
        }
      } else if (cmd) {
        output.textContent += `'${displayCmd}' is not recognized as an internal or external command.\n\n`;
        output.textContent += 'C:\\Documents and Settings\\Sathwik>';
      } else {
        output.textContent += '\nC:\\Documents and Settings\\Sathwik>';
      }
      
      input.value = '';
      output.scrollTop = output.scrollHeight;
    }
  });
}

// Clippy Assistant
function initializeClippy() {
  const clippy = document.getElementById('clippy');
  const clippyText = document.getElementById('clippy-text');
  const clippyClose = document.getElementById('clippy-close');
  const clippyChar = document.querySelector('.clippy-character');
  
  if (!clippy) return;
  
  const messages = [
    "It looks like you're viewing a portfolio. Would you like help?",
    "Did you know? Windows XP was released in 2001!",
    "Tip: Try clicking the Start menu for more applications!",
    "I see you've opened many windows. Want me to organize them?",
    "Fun fact: This portfolio was built with HTML, CSS, and JavaScript!",
    "You've been here for a while. Don't forget to stretch!",
    "Sathwik is a talented engineer. You should hire him!"
  ];
  
  // Random appearance
  setTimeout(() => {
    clippy.style.display = 'block';
    clippyText.textContent = messages[0];
  }, 8000);
  
  clippyClose.addEventListener('click', () => {
    clippy.style.display = 'none';
  });
  
  clippyChar.addEventListener('click', () => {
    state.clippyClicks++;
    
    if (state.clippyClicks === 5) {
      clippyText.textContent = 'Stop poking me! 😠';
      unlockAchievement('clippy-5', '📎 Clippy Annoyer', 'Clicked Clippy 5 times!');
    } else if (state.clippyClicks === 10) {
      clippyText.textContent = "I'm outta here! 👋";
      unlockAchievement('clippy-10', '📎 Clippy Destroyer', 'Annoyed Clippy away!');
      setTimeout(() => {
        clippy.style.display = 'none';
      }, 1500);
    } else {
      clippyText.textContent = messages[Math.floor(Math.random() * messages.length)];
    }
  });
}

// Easter Eggs
function initializeEasterEggs() {
  const startButton = document.getElementById('start-button');
  const bsod = document.getElementById('bsod');
  
  // Start button spam = BSOD
  startButton.addEventListener('click', () => {
    state.startButtonClicks++;
    
    if (!state.startButtonClickTimer) {
      state.startButtonClickTimer = setTimeout(() => {
        state.startButtonClicks = 0;
        state.startButtonClickTimer = null;
      }, 10000);
    }
    
    if (state.startButtonClicks >= 25) {
      bsod.style.display = 'block';
      state.startButtonClicks = 0;
      unlockAchievement('bsod', '💀 BSOD Trigger', 'Caused a Blue Screen of Death!');
      
      const hideBSOD = () => {
        bsod.style.display = 'none';
        document.removeEventListener('keydown', hideBSOD);
        document.removeEventListener('click', hideBSOD);
      };
      
      document.addEventListener('keydown', hideBSOD);
      document.addEventListener('click', hideBSOD);
    }
  });
  
  // Konami Code
  document.addEventListener('keydown', (e) => {
    state.konamiCode.push(e.key);
    if (state.konamiCode.length > 10) state.konamiCode.shift();
    
    if (state.konamiCode.join(',') === state.konamiPattern.join(',')) {
      activateGodMode();
      state.konamiCode = [];
    }
  });
}

function activateGodMode() {
  unlockAchievement('konami', '🎮 Konami Master', 'Entered the Konami Code!');
  
  // Show clippy
  const clippy = document.getElementById('clippy');
  clippy.style.display = 'block';
  document.getElementById('clippy-text').textContent = '🎉 GOD MODE ACTIVATED! All easter eggs unlocked!';
  
  // Confetti effect
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.zIndex = '99999';
      confetti.style.pointerEvents = 'none';
      document.body.appendChild(confetti);
      
      const duration = 3000 + Math.random() * 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          confetti.style.top = (progress * window.innerHeight) + 'px';
          confetti.style.left = (parseFloat(confetti.style.left) + Math.sin(progress * 10) * 2) + 'px';
          requestAnimationFrame(animate);
        } else {
          confetti.remove();
        }
      };
      
      animate();
    }, i * 30);
  }
  
  alert('🎉 GOD MODE ACTIVATED! \n\nYou found the Konami Code! All easter eggs are now unlocked!');
}

// Notepad Application
function initializeNotepad() {
  const textarea = document.getElementById('notepad-textarea');
  const status = document.getElementById('notepad-status');
  
  if (!textarea) return;
  
  // Update status bar
  function updateStatus() {
    const lines = textarea.value.split('\n');
    const lineNumber = textarea.value.substr(0, textarea.selectionStart).split('\n').length;
    const colNumber = textarea.selectionStart - textarea.value.lastIndexOf('\n', textarea.selectionStart - 1);
    status.textContent = `Ln ${lineNumber}, Col ${colNumber}`;
  }
  
  textarea.addEventListener('input', () => {
    updateStatus();
    
    // .LOG feature
    if (textarea.value.startsWith('.LOG')) {
      const lines = textarea.value.split('\n');
      if (lines.length === 1) {
        const now = new Date();
        const timestamp = now.toLocaleString();
        textarea.value = '.LOG\n\n' + timestamp + '\n';
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        unlockAchievement('notepad-log', '📝 Notepad Pro', 'Found the .LOG feature!');
      }
    }
  });
  
  textarea.addEventListener('click', updateStatus);
  textarea.addEventListener('keyup', updateStatus);
  
  // Auto-focus when window opens
  const notepadWindow = document.getElementById('notepad-window');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!notepadWindow.classList.contains('hidden')) {
          setTimeout(() => textarea.focus(), 100);
        }
      }
    });
  });
  
  observer.observe(notepadWindow, { attributes: true });
}

// Help Window
function initializeHelpWindow() {
  // Help window already exists in HTML, just needs to be openable
  // F1 key is handled in keyboard shortcuts
}

// Welcome Dialog
function showWelcomeDialog() {
  if (!state.firstVisit) return;
  
  const dialog = document.createElement('div');
  dialog.className = 'welcome-dialog';
  dialog.innerHTML = `
    <div class="welcome-dialog-title">
      <span style="margin-right:5px;">💻</span>
      <span>Welcome to Sathwik's Portfolio</span>
    </div>
    <div class="welcome-dialog-content">
      <h2>👋 Welcome to Windows XP Portfolio!</h2>
      <p>Experience my portfolio in authentic Windows XP style! This interactive portfolio showcases:</p>
      
      <div style="background:#FFF9E6;padding:12px;border:2px solid #FFD700;border-radius:6px;margin:15px 0;">
        <h3 style="color:#000;font-size:13px;margin-bottom:8px;">🌟 Major Achievements</h3>
        <ul style="margin-left:20px;font-size:11px;">
          <li><strong>🏆 Patent Granted</strong> - AeroWave (IPO)</li>
          <li><strong>📚 Published in Springer</strong> - WATCHDOG Research</li>
          <li><strong>💰 ₹16.5 Lakhs MSME Grant</strong> - Government of India</li>
          <li><strong>📰 Featured in Times of India</strong></li>
          <li><strong>🥉 FKCCI Manthan Top 10</strong> Finalist</li>
        </ul>
      </div>
      
      <p><strong>🛠️ Portfolio Features:</strong></p>
      <ul style="margin-left: 20px; margin-bottom: 15px;">
        <li>15+ IoT, AI &amp; Embedded Systems projects</li>
        <li>14 working applications with real functionality</li>
        <li>Draggable windows and authentic XP interface</li>
        <li>20+ hidden easter eggs to discover</li>
        <li>Full keyboard support - press <kbd>F1</kbd> for help!</li>
      </ul>
      
      <p><strong>💡 Quick Start:</strong></p>
      <ul style="margin-left: 20px;">
        <li>Double-click <strong>Achievements</strong> to see awards</li>
        <li>Open <strong>Internet Explorer</strong> for all 15 projects</li>
        <li>Check <strong>My Documents</strong> for experience timeline</li>
        <li>Press <kbd>F1</kbd> anytime for help and shortcuts</li>
      </ul>
      <div class="welcome-dialog-buttons">
        <button class="xp-button" id="start-tour-btn">🎯 View Achievements</button>
        <button class="xp-button" id="skip-tour-btn">⏭️ Explore Portfolio</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  document.getElementById('start-tour-btn').addEventListener('click', () => {
    dialog.remove();
    startTour();
  });
  
  document.getElementById('skip-tour-btn').addEventListener('click', () => {
    dialog.remove();
    state.firstVisit = false;
  });
}

function startTour() {
  state.firstVisit = false;
  
  // Open Achievements window first
  setTimeout(() => {
    openWindow('achievements-window');
    showTooltip('Check out the major achievements!', 400, 200, 4000);
  }, 200);
  
  setTimeout(() => {
    unlockAchievement('tour-complete', '🎓 Portfolio Explored', 'Started exploring the portfolio!');
  }, 1000);
}

// Tooltip System
function initializeTooltips() {
  // Tooltips are shown programmatically
}

function showTooltip(text, x, y, duration = 2000) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  
  document.body.appendChild(tooltip);
  
  setTimeout(() => {
    tooltip.remove();
  }, duration);
}

// Achievement System
function initializeAchievements() {
  state.achievements = [];
}

function unlockAchievement(id, title, description) {
  if (state.achievements.includes(id)) return;
  
  state.achievements.push(id);
  showAchievementToast(title, description);
  
  // Track specific achievements
  if (state.achievements.length >= 5) {
    if (!state.achievements.includes('collector')) {
      unlockAchievement('collector', '🏆 Achievement Collector', 'Unlocked 5 achievements!');
    }
  }
}

function showAchievementToast(title, description) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = `
    <div class="achievement-icon">🏆</div>
    <div style="overflow:hidden;">
      <div class="achievement-text">${title}</div>
      <div class="achievement-desc">${description}</div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'achievementSlide 0.4s ease-out reverse';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Idle Detection for Screen Saver
function initializeIdleDetection() {
  let idleTimeout = null;
  
  function resetIdle() {
    state.idleTime = 0;
    if (idleTimeout) clearTimeout(idleTimeout);
    
    // Start screen saver after 2 minutes
    idleTimeout = setTimeout(() => {
      startScreenSaver();
    }, 120000);
  }
  
  document.addEventListener('mousemove', resetIdle);
  document.addEventListener('keydown', resetIdle);
  document.addEventListener('click', resetIdle);
  
  resetIdle();
}

function startScreenSaver() {
  const screensaver = document.createElement('div');
  screensaver.className = 'screensaver active';
  screensaver.innerHTML = '<div class="flying-logo">🪟 Windows XP</div>';
  
  document.body.appendChild(screensaver);
  
  const dismissScreenSaver = () => {
    screensaver.remove();
    document.removeEventListener('mousemove', dismissScreenSaver);
    document.removeEventListener('keydown', dismissScreenSaver);
    document.removeEventListener('click', dismissScreenSaver);
  };
  
  document.addEventListener('mousemove', dismissScreenSaver);
  document.addEventListener('keydown', dismissScreenSaver);
  document.addEventListener('click', dismissScreenSaver);
}

// Keyboard Shortcuts
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + F4: Close active window
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      const activeWindow = document.querySelector('.window.active');
      if (activeWindow) {
        closeWindow(activeWindow.id);
      }
    }
    
    // F1: Help
    if (e.key === 'F1') {
      e.preventDefault();
      openWindow('help-window');
      unlockAchievement('help-opened', '❓ Help Seeker', 'Opened the help window!');
    }
    
    // F5: Refresh
    if (e.key === 'F5') {
      e.preventDefault();
      const desktop = document.getElementById('desktop');
      desktop.style.opacity = '0.5';
      setTimeout(() => {
        desktop.style.opacity = '1';
      }, 200);
    }
    
    // Win + D: Show desktop
    if (e.key === 'd' && (e.metaKey || e.altKey)) {
      e.preventDefault();
      document.querySelectorAll('.window').forEach(w => {
        w.classList.add('hidden');
      });
    }
    
    // Win + E: Open My Computer
    if (e.key === 'e' && (e.metaKey || e.altKey)) {
      e.preventDefault();
      openWindow('about-window');
    }
  });
}

// Restart Button
function initializeRestart() {
  const restartBtn = document.getElementById('restart-btn');
  if (!restartBtn) return;
  
  restartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to restart?')) {
      location.reload();
    }
  });
}