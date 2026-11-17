// Envia o lembrete do Passinho. Roda no GitHub Actions nos horários do lembretes.yml.
// Segredos no GitHub: VAPID_PRIVATE_KEY e INSCRICAO (o código que ela manda).
const webpush = require('web-push');
const PUBLICA = 'BEP4FPXfmrRfctQtmTUqv6XX01ZDYMaxS-SFEsFOBDcIB-kexuE0VEuh7yo5wIo8_q8FARs2cXTa0dlsAxOrSk8';
const MENSAGENS = {
  manha: [
    'Bom dia! Como foi a noite? Anotar o sono já vale o dia.',
    'Bom dia! Um copo de água e anotar o sono: dois passinhos antes do café.',
    'Acordou? Conta pro Passinho como foi a noite.'
  ],
  almoco: [
    'Hora do almoço! Proteína, verdura e carboidrato no prato valem moedas.',
    'Almoço chegando: que tal anotar o prato e ver a plantinha crescer?',
    'Lembra da água e de um verdinho no prato.'
  ],
  noite: [
    'Ainda dá tempo de um passinho hoje: alongar 2 minutos já conta.',
    'Sua caixinha do dia pode estar esperando. Uma missão libera!',
    'Antes de deitar: 15 minutos sem celular ajudam a dormir melhor.'
  ],
  teste: ['Teste de lembrete do Passinho. Se chegou, está tudo certo!']
};
function turno(){
  const forcado = process.env.TURNO; if (forcado) return forcado;
  const h = new Date().getUTCHours(); // horário de Brasília = UTC-3
  if (h >= 10 && h <= 12) return 'manha';
  if (h >= 14 && h <= 17) return 'almoco';
  if (h >= 21 || h <= 1) return 'noite';
  return 'teste';
}
(async () => {
  const priv = process.env.VAPID_PRIVATE_KEY, insc = process.env.INSCRICAO;
  if (!priv || !insc){ console.log('Falta configurar os segredos VAPID_PRIVATE_KEY e INSCRICAO. Nada enviado.'); return; }
  let sub; try { sub = JSON.parse(insc.trim()); } catch (e) { console.log('INSCRICAO não é um código válido. Peça para ela mandar de novo (Ajustes > Lembretes > Enviar código).'); process.exitCode = 1; return; }
  webpush.setVapidDetails('mailto:israelricardomoreira@users.noreply.github.com', PUBLICA, priv);
  const t = turno(), lista = MENSAGENS[t] || MENSAGENS.teste;
  const body = lista[new Date().getUTCDate() % lista.length];
  try {
    const r = await webpush.sendNotification(sub, JSON.stringify({title:'Passinho', body, tag:t, url:'./'}), {TTL: 4 * 3600, urgency:'normal'});
    console.log('Enviado (' + t + '):', body, '| status', r.statusCode);
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) console.log('A inscrição expirou. Ela precisa ativar os lembretes de novo e mandar o código novo.');
    else console.log('Erro ao enviar:', e.statusCode, e.body || e.message);
    process.exitCode = 1;
  }
})();
