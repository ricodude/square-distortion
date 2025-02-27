const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Configuration
const config = {
    gridSize: 15,          // Number of squares in each row/column
    squareSize: 40,        // Base size of each square
    maxDistortion: 40,     // Maximum distance squares can move
    distortionRadius: 200, // How far from the cursor the distortion affects
    speed: 0.1            // Speed of the distortion effect
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

let mouseX = 0;
let mouseY = 0;
let squares = [];

// Square class to manage individual squares
class Square {
    constructor(x, y, row, col) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.row = row;
        this.col = col;
        // Assign color based on position for a more organized pattern
        const colorIndex = (row + col) % colors.length;
        this.color = colors[colorIndex];
    }

    update() {
        // Calculate distance from mouse
        const dx = mouseX - this.baseX;
        const dy = mouseY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distortion based on distance
        const distortion = Math.max(0, 1 - distance / config.distortionRadius);
        
        // Apply smooth movement with expansion effect
        const targetX = this.baseX - dx * distortion * config.maxDistortion / (distance || 1);
        const targetY = this.baseY - dy * distortion * config.maxDistortion / (distance || 1);
        
        this.x += (targetX - this.x) * config.speed;
        this.y += (targetY - this.y) * config.speed;
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

// Draw the connected grid with circles
function drawGrid() {
    ctx.fillStyle = '#1a1a1a';  // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw filled polygons between squares
    for (let row = 0; row < config.gridSize - 1; row++) {
        for (let col = 0; col < config.gridSize - 1; col++) {
            const square = squares[row * config.gridSize + col];
            const rightSquare = squares[row * config.gridSize + col + 1];
            const bottomSquare = squares[(row + 1) * config.gridSize + col];
            const bottomRightSquare = squares[(row + 1) * config.gridSize + col + 1];

            // Draw the square
            ctx.beginPath();
            ctx.moveTo(square.x, square.y);
            ctx.lineTo(rightSquare.x, rightSquare.y);
            ctx.lineTo(bottomRightSquare.x, bottomRightSquare.y);
            ctx.lineTo(bottomSquare.x, bottomSquare.y);
            ctx.closePath();

            // Create gradient between the four corner colors
            const gradient = ctx.createLinearGradient(square.x, square.y, bottomRightSquare.x, bottomRightSquare.y);
            gradient.addColorStop(0, square.color);
            gradient.addColorStop(0.5, rightSquare.color);
            gradient.addColorStop(0.5, bottomSquare.color);
            gradient.addColorStop(1, bottomRightSquare.color);
            
            ctx.fillStyle = gradient;
            ctx.fill();

            // Calculate cell width and height for distorted ellipse
            const cellWidth = Math.sqrt(
                Math.pow(rightSquare.x - square.x, 2) +
                Math.pow(rightSquare.y - square.y, 2)
            );
            const cellHeight = Math.sqrt(
                Math.pow(bottomSquare.x - square.x, 2) +
                Math.pow(bottomSquare.y - square.y, 2)
            );

            // Calculate center of the cell
            const centerX = (square.x + rightSquare.x + bottomSquare.x + bottomRightSquare.x) / 4;
            const centerY = (square.y + rightSquare.y + bottomSquare.y + bottomRightSquare.y) / 4;

            // Calculate rotation angle based on cell distortion
            const angleX = Math.atan2(rightSquare.y - square.y, rightSquare.x - square.x);
            
            // Save context for rotation
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angleX);

            // Draw distorted circle (ellipse)
            ctx.beginPath();
            ctx.ellipse(
                0, 0,
                cellWidth * 0.48,
                cellHeight * 0.48,
                0, 0, Math.PI * 2
            );
            ctx.restore();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';  // Subtle white circles
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; // Very subtle white borders
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    squares.forEach(square => {
        square.update();
    });
    
    drawGrid();
    
    requestAnimationFrame(animate);
}

// Handle window resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initializeSquares();
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Touch support
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
}, { passive: false });

// Initialize
resizeCanvas();
animate();
