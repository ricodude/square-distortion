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
    magnification: 1.8    // Magnification factor for hover effect
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
    
    config.maxDistortion = config.squareSize * 1.5;
    config.distortionRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
}

// Square class to manage individual squares
class Square {
    constructor(x, y, row, col) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.row = row;
        this.col = col;
        this.scale = 1;
        const colorIndex = (row + col) % colors.length;
        this.color = colors[colorIndex];
    }

    update() {
        const dx = mouseX - this.baseX;
        const dy = mouseY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distortion based on distance
        const distortion = Math.max(0, 1 - distance / config.distortionRadius);
        const distortionEffect = Math.pow(distortion, 0.75);
        
        // Calculate magnification effect
        const targetScale = 1 + (config.magnification - 1) * distortionEffect;
        this.scale += (targetScale - this.scale) * config.speed;
        
        // Calculate position with magnification offset
        const scaleDiff = (this.scale - 1) * config.squareSize * 0.5;
        const moveX = dx * distortionEffect * 0.3 - scaleDiff;
        const moveY = dy * distortionEffect * 0.3 - scaleDiff;
        
        this.x += (this.baseX + moveX - this.x) * config.speed;
        this.y += (this.baseY + moveY - this.y) * config.speed;
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

// Draw the connected grid
function drawGrid() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw filled polygons between squares
    for (let row = 0; row < config.gridSize - 1; row++) {
        for (let col = 0; col < config.gridSize - 1; col++) {
            const square = squares[row * config.gridSize + col];
            const rightSquare = squares[row * config.gridSize + col + 1];
            const bottomSquare = squares[(row + 1) * config.gridSize + col];
            const bottomRightSquare = squares[(row + 1) * config.gridSize + col + 1];

            // Calculate scaled positions for each corner
            const x1 = square.x + (config.squareSize * (square.scale - 1) / 2);
            const y1 = square.y + (config.squareSize * (square.scale - 1) / 2);
            const x2 = rightSquare.x + config.squareSize * rightSquare.scale - (config.squareSize * (rightSquare.scale - 1) / 2);
            const y2 = rightSquare.y + (config.squareSize * (rightSquare.scale - 1) / 2);
            const x3 = bottomRightSquare.x + config.squareSize * bottomRightSquare.scale - (config.squareSize * (bottomRightSquare.scale - 1) / 2);
            const y3 = bottomRightSquare.y + config.squareSize * bottomRightSquare.scale - (config.squareSize * (bottomRightSquare.scale - 1) / 2);
            const x4 = bottomSquare.x + (config.squareSize * (bottomSquare.scale - 1) / 2);
            const y4 = bottomSquare.y + config.squareSize * bottomSquare.scale - (config.squareSize * (bottomSquare.scale - 1) / 2);

            // Draw the quad
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.closePath();

            // Create gradient
            const gradient = ctx.createLinearGradient(x1, y1, x3, y3);
            gradient.addColorStop(0, square.color);
            gradient.addColorStop(0.5, rightSquare.color);
            gradient.addColorStop(0.5, bottomSquare.color);
            gradient.addColorStop(1, bottomRightSquare.color);
            
            ctx.fillStyle = gradient;
            ctx.fill();

            // Add subtle highlight based on distortion
            const avgScale = (square.scale + rightSquare.scale + bottomSquare.scale + bottomRightSquare.scale) / 4;
            const highlight = Math.min(0.3, (avgScale - 1) * 0.5);
            ctx.fillStyle = `rgba(255,255,255,${highlight})`;
            ctx.fill();
        }
    }
}

// Animation loop
function animate() {
    squares.forEach(square => square.update());
    drawGrid();
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
