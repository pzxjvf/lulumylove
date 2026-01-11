function avisarEla(titulo, mensagem) {
    emailjs.send ( " service_5p71uca " , " template_c1ic9e6 " , {
        titulo: titulo,
        mensagem: mensagem
    })
    .then(() => {
        console.log("Email enviado 💜");
    })
    .catch((err) => {
        console.error("Erro ao enviar email:", err);
    });
}
