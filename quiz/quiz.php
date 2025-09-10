<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quiz Romântico</title>
<style>
    body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: linear-gradient(to bottom, #f3e8ff, #e9d5ff);
        color: #4b006e;
        text-align: center;
        padding: 20px;

        
    }

    h1 {
        margin-top: 50px;
        font-size: 2em;
    }

    .instructions {
        max-width: 600px;
        margin: 20px auto;
        font-size: 1.1em;
        line-height: 1.6;
        background: rgba(255, 255, 255, 0.7);
        padding: 15px;
        border-radius: 15px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    button {
        background-color: #7b2cbf;
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 1.2em;
        cursor: pointer;
        transition: 0.3s;
        margin-top: 20px;
    }

    button:hover {
        background-color: #5a189a;
        transform: scale(1.05);
    }
</style>
</head>
<body>
    <h1>Quiz do Amor 💜</h1>
    <div class="instructions">
        <p>seguindo para o quiz da lulu e jv, será que tu conhece muito sobre nós?<br>
            INSTRUÇÕES:          
    </p>
    </div>
    <button onclick="startQuiz()">Inicfiar Quiz</button>

    <script>
        function startQuiz() {
            // Aqui você coloca o link da página do quiz real
            window.location.href = "quiz-perguntas.html";
        }
    </script>
</body>
</html>
