const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Configuration
const config = {
    gridSize: 12,          // Number of squares in each row/column
    squareSize: null,      // Will be calculated based on screen size
    maxDistortion: null,   // Will be calculated based on screen size
    distortionRadius: null,// Will be calculated based on screen size
    speed: 0.1,           // Speed of the distortion effect
    minSquareSize: 20,    // Minimum square size for small screens
    maxSquareSize: 40,    // Maximum square size for large screens
    maxPerspective: 0.3   // Maximum perspective angle (in radians)
};

// Color palette
const colors = [
    '#2C3E50', // Dark blue
    '#34495E', // Navy blue
    '#16A085', // Teal
    '#1ABC9C', // Turquoise
    '#2980B9', // Blue
    '#3498DB'  // Light blue
];

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let squares = [];
let isTouch = false;

// Calculate responsive values based on screen size
function calculateResponsiveValues() {
    const screenSize = Math.min(window.innerWidth, window.innerHeight);
    
    config.squareSize = Math.max(
        config.minSquareSize,
        Math.min(screenSize / config.gridSize * 0.8, config.maxSquareSize)
    );
    
    config.maxDistortion = config.squareSize * 1.2;
    config.distortionRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
}

// Square class to manage individual squares
class Square {
    constructor(x, y, row, col) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.perspectiveX = 0;
        this.perspectiveY = 0;
        this.rotation = 0;
        const colorIndex = (row + col) % colors.length;
        this.color = colors[colorIndex];
    }

    update() {
        const dx = mouseX - this.baseX;
        const dy = mouseY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distortion based on distance
        const distortion = Math.max(0, 1 - distance / config.distortionRadius);
        const distortionEffect = Math.pow(distortion, 0.85);
        
        // Calculate perspective angles based on mouse position
        const angleX = (dy / config.distortionRadius) * config.maxPerspective * distortionEffect;
        const angleY = (dx / config.distortionRadius) * config.maxPerspective * distortionEffect;
        
        // Smooth transitions for perspective
        this.perspectiveX += (angleX - this.perspectiveX) * config.speed;
        this.perspectiveY += (angleY - this.perspectiveY) * config.speed;
        
        // Calculate position with subtle movement
        const moveX = dx * distortionEffect * 0.2;
        const moveY = dy * distortionEffect * 0.2;
        
        this.x += (this.baseX + moveX - this.x) * config.speed;
        this.y += (this.baseY + moveY - this.y) * config.speed;
        
        // Calculate rotation based on mouse movement
        const targetRotation = Math.atan2(dy, dx) * distortionEffect * 0.2;
        this.rotation += (targetRotation - this.rotation) * config.speed;
    }

    draw() {
        ctx.save();
        
        // Move to square center
        ctx.translate(this.x + config.squareSize / 2, this.y + config.squareSize / 2);
        
        // Apply perspective rotation
        ctx.transform(
            Math.cos(this.perspectiveY), Math.sin(this.perspectiveX),
            Math.sin(this.perspectiveY), Math.cos(this.perspectiveX),
            0, 0
        );
        
        // Apply rotation
        ctx.rotate(this.rotation);
        
        // Draw square
        ctx.fillStyle = this.color;
        ctx.fillRect(-config.squareSize / 2, -config.squareSize / 2, 
                    config.squareSize, config.squareSize);
        
        // Add subtle shading based on perspective
        const shade = Math.abs(this.perspectiveX + this.perspectiveY) / (config.maxPerspective * 2);
        ctx.fillStyle = `rgba(0,0,0,${shade * 0.3})`;
        ctx.fillRect(-config.squareSize / 2, -config.squareSize / 2, 
                    config.squareSize, config.squareSize);
        
        ctx.restore();
    }
}

// Initialize the grid of squares
function initializeSquares() {
    squares = [];
    const startX = (canvas.width - config.gridSize * config.squareSize) / 2;
    const startY = (canvas.height - config.gridSize * config.squareSize) / 2;

    for (let row = 0; row < config.gridSize; row++) {
        for (let col = 0; col < config.gridSize; col++) {
            const x = startX + col * config.squareSize;
            const y = startY + row * config.squareSize;
            squares.push(new Square(x, y, row, col));
        }
    }
}

// Animation loop
function animate() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    squares.forEach(square => {
        square.update();
        square.draw();
    });
    
    requestAnimationFrame(animate);
}

// Handle window resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    calculateResponsiveValues();
    initializeSquares();
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (e) => {
    if (!isTouch) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
});

// Touch support
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isTouch = true;
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchend', () => {
    const animate = () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mouseX += (centerX - mouseX) * 0.05;
        mouseY += (centerY - mouseY) * 0.05;
        
        if (Math.abs(centerX - mouseX) > 0.1 || Math.abs(centerY - mouseY) > 0.1) {
            requestAnimationFrame(animate);
        } else {
            isTouch = false;
        }
    };
    animate();
});

// Initialize
calculateResponsiveValues();
resizeCanvas();
animate();
