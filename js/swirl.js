'use strict';

// Optimized settings for faster loading
const particleCount = window.innerWidth < 768 ? 200 : window.innerWidth < 1024 ? 350 : 500;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const rangeY = 100;
const baseTTL = 30;
const rangeTTL = 100;
const baseSpeed = 0.1;
const rangeSpeed = 1.5;
const baseRadius = 1;
const rangeRadius = 3;
const baseHue = 220;
const rangeHue = 100;
const noiseSteps = 6; // Reduced for better performance
const xOff = 0.00125;
const yOff = 0.00125;
const zOff = 0.0005;
const backgroundColor = 'hsla(260,40%,5%,1)';

// Performance optimization flags
let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let isLowPerformance = false;

// Scroll-responsive variables
let scrollY = 0;
let scrollProgress = 0;
let maxScroll = 0;
let scrollVelocity = 0;
let lastScrollY = 0;

// Dynamic animation parameters
let dynamicHueShift = 0;
let dynamicSpeedMultiplier = 1;
let dynamicNoiseIntensity = 1;
let dynamicParticleSize = 1;
let dynamicSwirl = 0;

let container;
let canvas;
let ctx;
let center;
let gradient;
let tick;
let simplex;
let particleProps;
let positions;
let velocities;
let lifeSpans;
let speeds;
let sizes;
let hues;

function setup() {
    // Check for reduced motion preference
    if (isReducedMotion) {
        console.log('Reduced motion detected, using simplified animation');
        return;
    }
    
    // Performance check - reduce particles on slower devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        isLowPerformance = true;
        console.log('Low performance device detected, optimizing animation');
    }
    
    createCanvas();
    resize();
    initParticles();
    setupScrollListener();
    
    // Mark canvas as loaded
    const canvasElement = document.querySelector('.content--canvas');
    if (canvasElement) {
        canvasElement.classList.add('loaded');
    }
    
    draw();
}

function setupScrollListener() {
  let smoothScrollVelocity = 0;
  
  function updateScrollValues() {
    let newScrollY = window.pageYOffset;
    maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    scrollProgress = Math.min(newScrollY / maxScroll, 1);
    
    // Calculate and smooth scroll velocity
    let rawVelocity = Math.abs(newScrollY - scrollY);
    smoothScrollVelocity = lerp(smoothScrollVelocity, rawVelocity, 0.15);
    scrollVelocity = smoothScrollVelocity;
    
    scrollY = newScrollY;
    
    // Update dynamic parameters based on scroll
    updateDynamicParameters();
  }
  
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollValues);
      ticking = true;
      setTimeout(() => { ticking = false; }, 16);
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
  updateScrollValues(); // Initial call
}

function updateDynamicParameters() {
  // Clamp scroll velocity to prevent extreme chaos but keep it exciting
  let clampedScrollVelocity = Math.min(scrollVelocity, 80); // Increased from 50
  
  // Hue shift based on scroll progress (back to dramatic effect)
  dynamicHueShift = scrollProgress * 120; // Increased from 60, but not full 180
  
  // Speed changes with scroll velocity (more responsive)
  let speedMultiplier = 1 + (clampedScrollVelocity * 0.015); // Increased from 0.005
  dynamicSpeedMultiplier = lerp(dynamicSpeedMultiplier, speedMultiplier, 0.15); // Faster response
  
  // Noise intensity varies with scroll position (more dramatic)
  dynamicNoiseIntensity = 1 + Math.sin(scrollProgress * Math.PI * 2) * 0.7; // Increased from 0.3
  
  // Particle size pulses with scroll position (more noticeable)
  dynamicParticleSize = 1 + Math.sin(scrollProgress * Math.PI * 4) * 0.4; // Increased from 0.15
  
  // Swirl effect intensifies in middle sections (more intense)
  dynamicSwirl = Math.sin(scrollProgress * Math.PI) * 1.5; // Increased from 0.8
}

function initParticles() {
  tick = 0;
  simplex = new SimplexNoise();
  particleProps = new Float32Array(particlePropsLength);

  let i;
  
  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    initParticle(i);
  }
}

function initParticle(i) {
  let x, y, vx, vy, life, ttl, speed, radius, hue;

  x = rand(canvas.a.width);
  y = center[1] + randRange(rangeY);
  vx = 0;
  vy = 0;
  life = 0;
  ttl = baseTTL + rand(rangeTTL);
  speed = (baseSpeed + rand(rangeSpeed)) * dynamicSpeedMultiplier;
  radius = (baseRadius + rand(rangeRadius)) * dynamicParticleSize;
  hue = (baseHue + rand(rangeHue) + dynamicHueShift) % 360;

  particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
}

function drawParticles() {
  let i;

  for (i = 0; i < particlePropsLength; i += particlePropCount) {
    updateParticle(i);
  }
}

function updateParticle(i) {
  let i2=1+i, i3=2+i, i4=3+i, i5=4+i, i6=5+i, i7=6+i, i8=7+i, i9=8+i;
  let n, x, y, vx, vy, life, ttl, speed, x2, y2, radius, hue;

  x = particleProps[i];
  y = particleProps[i2];
  
  // Apply scroll-based effects to noise calculation (more dramatic but controlled)
  let scrollNoise = Math.max(-1, Math.min(1, (scrollProgress - 0.5) * dynamicSwirl)); // Increased range
  let dynamicXOff = xOff * Math.max(0.3, Math.min(3, dynamicNoiseIntensity)); // Wider range
  let dynamicYOff = yOff * Math.max(0.3, Math.min(3, dynamicNoiseIntensity)); // Wider range
  let dynamicZOff = zOff + scrollNoise * 0.0008; // Slightly increased from 0.0005
  
  n = simplex.noise3D(x * dynamicXOff, y * dynamicYOff, tick * dynamicZOff) * noiseSteps * TAU;
  
  // Add scroll-based directional force (more dramatic)
  let scrollForceX = Math.sin(scrollProgress * Math.PI * 2) * 0.4; // Increased from 0.2
  let scrollForceY = Math.cos(scrollProgress * Math.PI * 2) * 0.25; // Increased from 0.1
  
  vx = lerp(particleProps[i3], cos(n) + scrollForceX, 0.5);
  vy = lerp(particleProps[i4], sin(n) + scrollForceY, 0.5);
  
  life = particleProps[i5];
  ttl = particleProps[i6];
  
  // Less restrictive speed multiplier but still capped
  let clampedSpeedMultiplier = Math.max(0.3, Math.min(4, dynamicSpeedMultiplier)); // Wider range
  speed = particleProps[i7] * clampedSpeedMultiplier;
  
  x2 = x + vx * speed;
  y2 = y + vy * speed;
  
  // Less restrictive particle size
  let clampedSizeMultiplier = Math.max(0.3, Math.min(2.5, dynamicParticleSize)); // Wider range
  radius = particleProps[i8] * clampedSizeMultiplier;
  
  hue = (particleProps[i9] + dynamicHueShift) % 360;

  drawParticle(x, y, x2, y2, life, ttl, radius, hue);

  life++;

  particleProps[i] = x2;
  particleProps[i2] = y2;
  particleProps[i3] = vx;
  particleProps[i4] = vy;
  particleProps[i5] = life;

  (checkBounds(x, y) || life > ttl) && initParticle(i);
}

function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
  ctx.a.save();
  ctx.a.lineCap = 'round';
  ctx.a.lineWidth = radius;
  
  // Dynamic opacity based on scroll velocity (more responsive)
  let clampedScrollVelocity = Math.min(scrollVelocity, 40); // Increased from 20
  let scrollOpacity = Math.min(1, 0.6 + clampedScrollVelocity * 0.008); // Increased multiplier
  let opacity = fadeInOut(life, ttl) * scrollOpacity;
  
  // Dynamic saturation and lightness based on scroll (more dramatic)
  let saturation = Math.min(100, Math.max(60, 80 + scrollProgress * 15)); // Wider range
  let lightness = Math.min(75, Math.max(35, 50 + Math.sin(scrollProgress * Math.PI) * 20)); // Wider range
  
  ctx.a.strokeStyle = `hsla(${hue},${saturation}%,${lightness}%,${opacity})`;
  ctx.a.beginPath();
  ctx.a.moveTo(x, y);
  ctx.a.lineTo(x2, y2);
  ctx.a.stroke()
  ctx.a.closePath();
  ctx.a.restore();
}

function checkBounds(x, y) {
	return(
		x > canvas.a.width ||
		x < 0 ||
		y > canvas.a.height ||
		y < 0
	);
}

function createCanvas() {
  container = document.querySelector('.content--canvas');
	canvas = {
		a: document.createElement('canvas'),
		b: document.createElement('canvas')
	};
	canvas.b.style = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	`;
	container.appendChild(canvas.b);
	ctx = {
		a: canvas.a.getContext('2d'),
		b: canvas.b.getContext('2d')
  };
  center = [];
}

function resize() {
	const { innerWidth, innerHeight } = window;
	
	canvas.a.width = innerWidth;
  canvas.a.height = innerHeight;

  ctx.a.drawImage(canvas.b, 0, 0);

	canvas.b.width = innerWidth;
  canvas.b.height = innerHeight;
  
  ctx.b.drawImage(canvas.a, 0, 0);

  center[0] = 0.5 * canvas.a.width;
  center[1] = 0.5 * canvas.a.height;
}

function renderGlow() {
  ctx.b.save();
  
  // Dynamic glow intensity based on scroll (more dramatic but controlled)
  let clampedScrollVelocity = Math.min(scrollVelocity, 50); // Increased from 30
  let glowIntensity = Math.min(300, 150 + clampedScrollVelocity * 1.5 + Math.sin(scrollProgress * Math.PI * 2) * 40);
  let blurAmount = Math.min(15, 8 + clampedScrollVelocity * 0.08); // Increased
  
  ctx.b.filter = `blur(${blurAmount}px) brightness(${glowIntensity}%)`;
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();

  ctx.b.save();
  ctx.b.filter = `blur(${blurAmount * 0.5}px) brightness(${glowIntensity}%)`;
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function renderToScreen() {
  ctx.b.save();
  ctx.b.globalCompositeOperation = 'lighter';
  ctx.b.drawImage(canvas.a, 0, 0);
  ctx.b.restore();
}

function draw() {
  tick++;

  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);

  // Dynamic background color based on scroll (more noticeable changes)
  let bgHue = (260 + dynamicHueShift * 0.2) % 360; // Increased from 0.1
  let bgLightness = Math.max(3, Math.min(8, 5 + Math.sin(scrollProgress * Math.PI) * 1.5)); // Increased range
  let dynamicBgColor = `hsla(${bgHue},40%,${bgLightness}%,1)`;
  
  ctx.b.fillStyle = dynamicBgColor;
  ctx.b.fillRect(0, 0, canvas.a.width, canvas.a.height);

  drawParticles();
  renderGlow();
  renderToScreen();

	window.requestAnimationFrame(draw);
}

window.addEventListener('load', setup);
window.addEventListener('resize', resize);