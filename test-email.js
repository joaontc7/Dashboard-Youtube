const { Resend } = require('resend');

const resend = new Resend('re_MBHysWbi_61avSLg3H12LkzvKwTEtzK8t');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'contato.ironmasters@gmail.com',
  subject: 'Testando disparo pelo Dashboard!',
  html: '<p>A <strong>API do Resend</strong> foi vinculada com sucesso no Dashboard dos Iron Masters!</p>'
}).then(console.log).catch(console.error);
