const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

const foraDoHorario = () => {
    const agora = new Date();
    const hora = agora.getHours();
    const dia = agora.getDay(); // 0 = Domingo, 6 = Sábado
    return dia === 0 || dia === 6 || hora < 9 || hora >= 18;
};

const estados = {}; // Controla o estado da conversa por número

client.on('message', async msg => {
    const chat = await msg.getChat();
    const from = msg.from;
    const texto = msg.body.toLowerCase();

    if (!from.endsWith('@c.us')) return;

    const foraHorarioOuTeste = foraDoHorario() || texto.includes('modo teste');

    // Se for a primeira interação fora do horário ou via "modo teste"
    if (foraHorarioOuTeste && !estados[from]) {
        estados[from] = 'inicio';

        await delay(1000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(from, `Olá, tudo bem? Não estamos disponíveis! Nosso horário para atendimento é de segunda a sexta, das 9h até 18h. Escolha uma das opções, por gentileza:\n\n1 - Estou apenas respondendo mensagens anteriores\n2 - É meu primeiro contato com a REMAX\n3 - Quero vender/alugar meu imóvel\n4 - Quero comprar um imóvel\n5 - Falar com atendente`);
        // Removido o return para permitir continuidade do fluxo
    }

    // Se o fluxo estiver ativo (estado definido)
    if (estados[from]) {
        switch (estados[from]) {
            case 'inicio':
                if (texto === '1') {
                    await client.sendMessage(from, 'Legal! Fique à vontade para nos escrever sobre a situação, e agilizar o atendimento.');
                    estados[from] = null;
                } else if (texto === '2') {
                    await client.sendMessage(from, 'Seja bem-vindo! Como podemos te ajudar?');
                    estados[from] = null;
                } else if (texto === '3') {
                    await client.sendMessage(from, 'Seu imóvel é casa ou apartamento?');
                    estados[from] = 'venda_tipo_imovel';
                } else if (texto === '4') {
                    await client.sendMessage(from, 'Você está procurando uma casa ou apartamento?');
                    estados[from] = 'compra_tipo_imovel';
                } else if (texto === '5') {
                    await client.sendMessage(from, 'Por favor, aguarde o atendimento.');
                    estados[from] = null;
                }
                break;

            case 'venda_tipo_imovel':
                await client.sendMessage(from, 'Por favor, nos informe o endereço completo do imóvel.');
                estados[from] = 'venda_endereco';
                break;

            case 'venda_endereco':
                await client.sendMessage(from, 'Ótimo, agora nos informe seu nome e sobrenome.');
                estados[from] = 'venda_nome';
                break;

            case 'venda_nome':
                await client.sendMessage(from, 'Legal! Agora, o valor do imóvel.');
                estados[from] = 'venda_valor';
                break;

            case 'venda_valor':
                await client.sendMessage(from, 'Por fim, informe o seu email.');
                estados[from] = 'venda_email';
                break;

            case 'venda_email':
                await client.sendMessage(from, 'Feito! Agora é só aguardar o atendimento.');
                estados[from] = null;
                break;

            case 'compra_tipo_imovel':
                await client.sendMessage(from, 'Em que região você está buscando?');
                estados[from] = 'compra_regiao';
                break;

            case 'compra_regiao':
                await client.sendMessage(from, 'O que você busca no imóvel?');
                estados[from] = 'compra_desejos';
                break;

            case 'compra_desejos':
                await client.sendMessage(from, 'Legal! Agora, uma média de valor do imóvel.');
                estados[from] = 'compra_valor';
                break;

            case 'compra_valor':
                await client.sendMessage(from, 'Agora, sobre você. Nos informe seu nome e sobrenome.');
                estados[from] = 'compra_nome';
                break;

            case 'compra_nome':
                await client.sendMessage(from, 'Por fim, informe o seu email.');
                estados[from] = 'compra_email';
                break;

            case 'compra_email':
                await client.sendMessage(from, 'Feito! Agora é só aguardar o atendimento.');
                estados[from] = null;
                break;
        }
    }
});
