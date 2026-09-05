<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lulu's Runner 💜</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap" rel="stylesheet">
    
    <!-- SDK do Supabase (Banco de Dados na Nuvem) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="../app.js"></script>

    <style>
        body {
            margin: 0;
            background: #f3e5f5;
            font-family: "Nunito", sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }

        .game-container {
            position: relative;
            box-shadow: 0 15px 35px rgba(122, 0, 255, 0.2);
            border-radius: 20px;
            overflow: hidden;
            border: 4px solid #fff;
            background: #ffffff;
        }

        canvas {
            display: block;
            background: #ffffff;
        }

        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(122, 0, 255, 0.2);
            backdrop-filter: blur(5px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #4a148c;
            transition: 0.3s;
        }

        .overlay h2 {
            font-size: 2.2rem;
            margin: 0 0 10px 0;
            font-weight: 800;
        }

        .overlay p {
            font-size: 1.1rem;
            margin: 0 0 15px 0;
            font-weight: 700;
        }

        .btn {
            background: #7a00ff;
            color: white;
            border: 2px solid #fff;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 1.1rem;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(122, 0, 255, 0.4);
            transition: 0.2s;
        }
        .btn:hover { transform: scale(1.05); }

        /* Tabela de Ranking dentro do Modal */
        .leaderboard {
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 15px;
            margin-bottom: 15px;
            width: 80%;
            max-width: 300px;
            text-align: left;
        }
        .leaderboard h3 { margin: 0 0 10px 0; color: #7a00ff; text-align: center; font-size: 1.1rem; }
        .rank-item { display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 5px; }
    </style>
</head>
<body>

<div class="game-container">
    <canvas id="gameCanvas" width="800" height="400"></canvas>
    
    <div class="overlay" id="gameOverlay">
        <h2 id="overlayTitle">Lulu's Runner 💜</h2>
        <div class="leaderboard">
            <h3>🏆 Recordes Globais (Nuvem)</h3>
            <div id="rankingList">Carregando ranking...</div>
        </div>
        <p id="overlaySub">Pressione ESPAÇO para pular os obstáculos</p>
        <button class="btn" id="startBtn" onclick="resetGame()">JOGAR</button>
    </div>
</div>

<script>
    // --- CONEXÃO COM O SUPABASE ---
    // Substitua os textos abaixo pelas chaves que você copiou do seu painel Supabase
    const SUPABASE_URL = 'sb_publishable_ZSoT-Mh9WG5Ol-9HApD5Bg_1UsL2BT1';
    const SUPABASE_KEY = 'sb_secret_KxciDpuE9ugi6D6mqVnzMA_qBFCVhqT';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const overlay = document.getElementById("gameOverlay");
    const overlayTitle = document.getElementById("overlayTitle");
    const overlaySub = document.getElementById("overlaySub");
    const rankingList = document.getElementById("rankingList");

    let gameActive = false;
    let score = 0;
    let highScore = 0;
    const jogadorNome = "Lulu"; // Ou altere dinamicamente se quiser

    const gravity = 0.6;
    const floorY = 340;

    // --- PERSONAGEM (BONECA NA CADEIRA DE RODAS COM VESTIDO ROXO) ---
    const player = {
        x: 100,
        y: floorY - 55,
        width: 45,
        height: 55,
        velocityY: 0,
        isJumping: false,
        draw() {
            ctx.save();
            const centerX = this.x + this.width / 2;
            
            // Cabelo Liso
            ctx.fillStyle = "#2d3436";
            ctx.fillRect(centerX - 10, this.y + 4, 18, 22);

            // Cabeça
            ctx.fillStyle = "#fbc531";
            ctx.beginPath();
            ctx.arc(centerX - 1, this.y + 10, 8, 0, Math.PI * 2);
            ctx.fill();

            // Vestido Roxo
            ctx.fillStyle = "#7a00ff";
            ctx.beginPath();
            ctx.moveTo(centerX - 8, this.y + 18);
            ctx.lineTo(centerX + 8, this.y + 18);
            ctx.lineTo(centerX + 12, this.y + 38);
            ctx.lineTo(centerX - 2, this.y + 38);
            ctx.closePath();
            ctx.fill();

            // Estrutura Cadeira de Rodas
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - 10, this.y + 16);
            ctx.lineTo(centerX - 10, this.y + 36);
            ctx.lineTo(centerX + 8, this.y + 36);
            ctx.lineTo(centerX + 12, this.y + 48);
            ctx.stroke();

            // Roda Grande
            ctx.strokeStyle = "#ffffff";
            ctx.fillStyle = "rgba(122, 0, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX - 4, this.y + 40, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Cubo Central
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(centerX - 4, this.y + 40, 3, 0, Math.PI * 2);
            ctx.fill();

            // Roda Pequena Dianteira
            ctx.beginPath();
            ctx.arc(centerX + 10, this.y + 50, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },
        jump() {
            if (!this.isJumping) {
                this.velocityY = -13;
                this.isJumping = true;
            }
        },
        update() {
            this.y += this.velocityY;
            this.velocityY += gravity;

            if (this.y >= floorY - this.height) {
                this.y = floorY - this.height;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
    };

    let obstacles = [];
    let gameSpeed = 5;
    let spawnTimer = 0;

    class Obstacle {
        constructor() {
            this.width = 25;
            this.height = 35;
            this.x = canvas.width;
            this.y = floorY - this.height;
        }
        draw() {
            ctx.fillStyle = "#7a00ff";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        update() { this.x -= gameSpeed; }
    }

    // --- LÓGICA DE BANCO DE DADOS (SUPABASE) ---
    async function salvarPontuacao(novaPontuacao) {
        try {
            await _supabase.from('ranking').insert([
                { jogador: jogadorNome, pontuacao: novaPontuacao }
            ]);
            carregarRanking();
        } catch (error) {
            console.error("Erro ao salvar no Supabase:", error);
        }
    }

    async function carregarRanking() {
        try {
            const { data, error } = await _supabase
                .from('ranking')
                .select('jogador, pontuacao')
                .order('pontuacao', { ascending: false })
                .limit(3);

            if (error) throw error;

            rankingList.innerHTML = "";
            if(data.length > 0) highScore = data[0].pontuacao;

            data.forEach((item, index) => {
                rankingList.innerHTML += `
                    <div class="rank-item">
                        <span>${index + 1}º ${item.jogador}</span>
                        <strong>${item.pontuacao} pts</strong>
                    </div>
                `;
            });
        } catch (error) {
            rankingList.innerHTML = "<div style='font-size:0.8rem; color:red;'>Conecte as chaves do Supabase</div>";
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            if (gameActive) player.jump();
            else resetGame();
        }
    });

    function resetGame() {
        obstacles = [];
        score = 0;
        gameSpeed = 5;
        player.y = floorY - player.height;
        player.velocityY = 0;
        gameActive = true;
        overlay.style.display = "none";
    }

    async function gameOver() {
        gameActive = false;
        await salvarPontuacao(score);
        
        overlayTitle.innerText = "Fim de Jogo! 💜";
        overlaySub.innerHTML = `Sua pontuação: <span>${score}</span>`;
        overlay.style.display = "flex";
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Chão Estilizado Roxo
        ctx.strokeStyle = "#7a00ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(canvas.width, floorY);
        ctx.stroke();

        if (gameActive) {
            player.update();

            spawnTimer--;
            if (spawnTimer <= 0) {
                obstacles.push(new Obstacle());
                spawnTimer = 90 + Math.random() * 60;
            }
            gameSpeed += 0.001;
        }

        player.draw();

        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (gameActive) obstacles[i].update();
            obstacles[i].draw();

            if (
                player.x < obstacles[i].x + obstacles[i].width &&
                player.x + player.width > obstacles[i].x &&
                player.y < obstacles[i].y + obstacles[i].height &&
                player.y + player.height > obstacles[i].y
            ) {
                gameOver();
            }

            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                if (gameActive) score++;
            }
        }

        ctx.fillStyle = "#4a148c";
        ctx.font = "bold 20px Nunito";
        ctx.fillText(`Score: ${score}`, 30, 40);

        requestAnimationFrame(gameLoop);
    }

    carregarRanking();
    gameLoop();
</script>

</body>
</html>