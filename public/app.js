const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

// Ajustar o tamanho da tela
canvasElement.width = 1024;
canvasElement.height = 768;
videoElement.width = 1024;
videoElement.height = 768;

// Inicializar o MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1024,
    height: 768
});
camera.start();

// Variáveis das formas geométricas
let shapes = [
    { type: 'circle', x: 100, y: 100, color: '#FF0000', radius: 40 },   // Círculo vermelho
    { type: 'square', x: 300, y: 100, color: '#00FF00', size: 80 },    // Quadrado verde
    { type: 'triangle', x: 500, y: 100, color: '#0000FF', size: 80 }   // Triângulo azul
];
let selectedColor = null; // Armazena a cor selecionada pelo botão
let isMovingShape = false; // Verifica se estamos movendo um shape
let currentShape = null; // Armazena o shape atual a ser movido
let shapeAdded = false; // Controla se uma forma foi adicionada recentemente

let isHandClosedPrev = false; // Para controlar o estado da mão fechada na interação anterior

// Atualização dos botões de cores (com menos espaçamento)
let buttons = [
    { x: 50, y: 670, width: 100, height: 50, color: '#FF0000', label: 'Red' },
    { x: 170, y: 670, width: 100, height: 50, color: '#00FF00', label: 'Green' },
    { x: 290, y: 670, width: 100, height: 50, color: '#0000FF', label: 'Blue' },
    { x: 480, y: 670, width: 120, height: 50, color: '#FFA500', label: 'Add Circle' },
    { x: 620, y: 670, width: 120, height: 50, color: '#FFA500', label: 'Add Square' },
    { x: 760, y: 670, width: 120, height: 50, color: '#FFA500', label: 'Add Triangle' },
    { x: 900, y: 670, width: 120, height: 50, color: '#FF4500', label: 'Delete Shape' } // Botão de deletar
];

// Função chamada a cada detecção de mão
function onResults(results) {
    // Limpar o canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Desenhar as formas geométricas
    drawShapes();

    // Desenhar os botões de cores
    drawButtons();

    // Verificar se há mãos detectadas
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // Detectar interação com formas e botões
            detectInteraction(landmarks);

            // Desenhar os landmarks das mãos
            drawLandmarks(landmarks);
        }
    }
}

// Função para desenhar os landmarks das mãos
function drawLandmarks(landmarks) {
    canvasCtx.strokeStyle = "#FF0000";
    canvasCtx.lineWidth = 3;

    for (const landmark of landmarks) {
        const x = (1 - landmark.x) * canvasElement.width;
        const y = landmark.y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = '#FF0000';
        canvasCtx.fill();
    }
}

// Função para desenhar as formas geométricas
function drawShapes() {
    shapes.forEach(shape => {
        canvasCtx.fillStyle = shape.color;

        if (shape.type === 'circle') {
            canvasCtx.beginPath();
            canvasCtx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            canvasCtx.fill();
        } else if (shape.type === 'square') {
            canvasCtx.fillRect(shape.x - shape.size / 2, shape.y - shape.size / 2, shape.size, shape.size);
        } else if (shape.type === 'triangle') {
            canvasCtx.beginPath();
            canvasCtx.moveTo(shape.x, shape.y - shape.size / 2);
            canvasCtx.lineTo(shape.x - shape.size / 2, shape.y + shape.size / 2);
            canvasCtx.lineTo(shape.x + shape.size / 2, shape.y + shape.size / 2);
            canvasCtx.closePath();
            canvasCtx.fill();
        }
    });
}

// Função para desenhar os botões de cores no canvas
function drawButtons() {
    buttons.forEach(button => {
        canvasCtx.fillStyle = button.color;
        canvasCtx.fillRect(button.x, button.y, button.width, button.height);
        canvasCtx.fillStyle = '#FFFFFF';
        canvasCtx.font = '16px Arial';
        canvasCtx.fillText(button.label, button.x + 20, button.y + 30);
    });
}

// Função para detectar interação com botões e formas
function detectInteraction(landmarks) {
    const indexFinger = landmarks[8];  // Ponta do dedo indicador
    const thumb = landmarks[4];        // Ponta do polegar
    const xFinger = (1 - indexFinger.x) * canvasElement.width;
    const yFinger = indexFinger.y * canvasElement.height;
    const xThumb = (1 - thumb.x) * canvasElement.width;
    const yThumb = thumb.y * canvasElement.height;

    const isHandClosed = Math.hypot(xFinger - xThumb, yFinger - yThumb) < 50;

    // Verificar interação com botões de cor
    buttons.forEach(button => {
        if (xFinger > button.x && xFinger < button.x + button.width &&
            yFinger > button.y && yFinger < button.y + button.height) {
            if (!isHandClosed || isHandClosedPrev) return; // Verificação para não criar múltiplas formas

            if (button.label.startsWith('Add')) {
                if (shapeAdded) return; // Impede múltiplas formas de serem criadas

                let newShape = null;
                if (button.label === 'Add Circle') {
                    newShape = { type: 'circle', x: Math.random() * 800 + 100, y: Math.random() * 600 + 100, color: '#FF00FF', radius: 40 };
                } else if (button.label === 'Add Square') {
                    newShape = { type: 'square', x: Math.random() * 800 + 100, y: Math.random() * 600 + 100, color: '#FF00FF', size: 80 };
                } else if (button.label === 'Add Triangle') {
                    newShape = { type: 'triangle', x: Math.random() * 800 + 100, y: Math.random() * 600 + 100, color: '#FF00FF', size: 80 };
                }

                if (newShape) {
                    shapes.push(newShape);
                    shapeAdded = true;
                    setTimeout(() => shapeAdded = false, 1000); // Impede a criação de novas formas por 1 segundo
                }
            } else if (button.label === 'Delete Shape') {
                selectedColor = 'delete';  // Modo de exclusão
            } else {
                selectedColor = button.color; // Modo de seleção de cor
            }
        }
    });

    // Verificar interação com formas geométricas
    shapes.forEach((shape, index) => {
        let isHit = false;
        if (shape.type === 'circle') {
            const distance = Math.hypot(xFinger - shape.x, yFinger - shape.y);
            isHit = distance < shape.radius;
        } else if (shape.type === 'square') {
            isHit = xFinger > shape.x - shape.size / 2 && xFinger < shape.x + shape.size / 2 &&
                yFinger > shape.y - shape.size / 2 && yFinger < shape.y + shape.size / 2;
        } else if (shape.type === 'triangle') {
            isHit = checkPointInTriangle(xFinger, yFinger, shape);
        }

        if (isHit) {
            if (selectedColor === 'delete') {
                shapes.splice(index, 1);  // Deleta a forma
                return;
            } else if (selectedColor) {
                shape.color = selectedColor; // Alterar cor
            }
            currentShape = shape; // Preparar para movimentação
            isMovingShape = true; // Ativar movimentação
        }
    });

    // Movimentação da forma
    if (isMovingShape && currentShape) {
        if (isHandClosed) {
            currentShape.x = xFinger;
            currentShape.y = yFinger;
        } else {
            isMovingShape = false;
            currentShape = null;
        }
    }

    isHandClosedPrev = isHandClosed; // Atualiza o estado anterior da mão
}

// Função para verificar se um ponto está dentro de um triângulo
function checkPointInTriangle(px, py, triangle) {
    const { x, y, size } = triangle;
    const x1 = x, y1 = y - size / 2;
    const x2 = x - size / 2, y2 = y + size / 2;
    const x3 = x + size / 2, y3 = y + size / 2;

    const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;

    return a > 0 && b > 0 && c > 0;
}
const shapeCanvas = document.getElementById('shapeCanvas');
const shapeCtx = shapeCanvas.getContext('2d');

// Função para obter uma forma geométrica aleatória
// Função para obter uma forma geométrica aleatória com cores específicas
function getRandomShape() {
    const shapeTypes = ['circle', 'square', 'triangle'];
    const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    
    // Limitar as cores para vermelho, verde ou azul
    const colorOptions = ['#FF0000', '#00FF00', '#0000FF'];  // Red, Green, Blue
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    return { type: randomShape, color: randomColor };
}


// Função para desenhar formas aleatórias no canvas lateral
function drawRandomShapes() {
    shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);  // Limpa o canvas lateral
    
    for (let i = 0; i < 3; i++) {  // Desenha 3 formas aleatórias
        const shape = getRandomShape();
        const x = 100;  // Posição x central no canvas lateral
        const y = (i + 1) * 200;  // Espaçamento vertical entre formas
        shapeCtx.fillStyle = shape.color;
        
        if (shape.type === 'circle') {
            shapeCtx.beginPath();
            shapeCtx.arc(x, y, 40, 0, 2 * Math.PI);
            shapeCtx.fill();
        } else if (shape.type === 'square') {
            shapeCtx.fillRect(x - 40, y - 40, 80, 80);
        } else if (shape.type === 'triangle') {
            shapeCtx.beginPath();
            shapeCtx.moveTo(x, y - 40);
            shapeCtx.lineTo(x - 40, y + 40);
            shapeCtx.lineTo(x + 40, y + 40);
            shapeCtx.closePath();
            shapeCtx.fill();
        }
    }
}

// Chama a função para desenhar formas aleatórias ao carregar a página
drawRandomShapes();
// Função para resetar as formas aleatórias
function resetShapes() {
    drawRandomShapes();  // Chama a função que desenha novas formas aleatórias
}






// Detecta quando o marcador Hiro é perdido
hiroMarker.addEventListener('markerLost', () => {
    console.log('Marcador Hiro perdido');
    // Ação quando o marcador é perdido
});

// Função para criar um shape aleatório
function createRandomShape() {
    const shapeTypes = ['sphere', 'box', 'cone'];  // Tipos de formas 3D
    const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    
    const colorOptions = ['#FF0000', '#00FF00', '#0000FF'];  // Cores disponíveis
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    return { type: randomShape, color: randomColor };
}

// Função para resetar as formas aleatórias
function resetShapes() {
    drawRandomShapes();  // Chama a função que desenha novas formas aleatórias
}

// Função para desenhar as formas aleatórias no canvas lateral
function drawRandomShapes() {
    shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);  // Limpa o canvas lateral
    
    for (let i = 0; i < 3; i++) {  // Desenha 3 formas aleatórias
        const shape = getRandomShape();
        const x = 100;  // Posição x central no canvas lateral
        const y = (i + 1) * 200;  // Espaçamento vertical entre formas
        shapeCtx.fillStyle = shape.color;
        
        if (shape.type === 'circle') {
            shapeCtx.beginPath();
            shapeCtx.arc(x, y, 40, 0, 2 * Math.PI);
            shapeCtx.fill();
        } else if (shape.type === 'square') {
            shapeCtx.fillRect(x - 40, y - 40, 80, 80);
        } else if (shape.type === 'triangle') {
            shapeCtx.beginPath();
            shapeCtx.moveTo(x, y - 40);
            shapeCtx.lineTo(x - 40, y + 40);
            shapeCtx.lineTo(x + 40, y + 40);
            shapeCtx.closePath();
            shapeCtx.fill();
        }
    }
}

// Função para obter uma forma geométrica aleatória
function getRandomShape() {
    const shapeTypes = ['circle', 'square', 'triangle'];
    const randomShape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    
    const colorOptions = ['#FF0000', '#00FF00', '#0000FF'];  // Red, Green, Blue
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    return { type: randomShape, color: randomColor };
}

console.log("O valor da variável markerPosition é:", markerPosition);


const marker = document.querySelector('a-marker');

marker.addEventListener('markerFound', () => {
    console.log('Marcador detectado');

    // Tente criar e posicionar a forma aqui
    const randomShape = createRandomShape();
    createShape(randomShape.type, randomShape.color, '0 0 0'); 
});

