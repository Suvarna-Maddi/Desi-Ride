import tls from 'node:tls';

export function sendSmtpMessage({ host = 'smtp.gmail.com', port = 465, user, pass, to, subject, html }) {
  return new Promise((resolve) => {
    if (!user || !pass || !to) {
      return resolve({ success: false, error: 'Missing SMTP credentials' });
    }

    let resolved = false;
    const socket = tls.connect(port, host, { timeout: 10000 }, () => {});

    let step = 0;
    const cleanUserB64 = Buffer.from(user).toString('base64');
    const cleanPassB64 = Buffer.from(pass.replace(/\s+/g, '')).toString('base64');

    socket.on('data', (data) => {
      const msg = data.toString();
      const code = parseInt(msg.slice(0, 3), 10);

      if (code >= 400) {
        if (!resolved) {
          resolved = true;
          socket.end();
          resolve({ success: false, error: msg.trim() });
        }
        return;
      }

      if (step === 0 && code === 220) {
        step = 1;
        socket.write(`EHLO desiride.in\r\n`);
      } else if (step === 1 && code === 250) {
        step = 2;
        socket.write(`AUTH LOGIN\r\n`);
      } else if (step === 2 && code === 334) {
        step = 3;
        socket.write(`${cleanUserB64}\r\n`);
      } else if (step === 3 && code === 334) {
        step = 4;
        socket.write(`${cleanPassB64}\r\n`);
      } else if (step === 4 && code === 235) {
        step = 5;
        socket.write(`MAIL FROM:<${user}>\r\n`);
      } else if (step === 5 && code === 250) {
        step = 6;
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (step === 6 && code === 250) {
        step = 7;
        socket.write(`DATA\r\n`);
      } else if (step === 7 && code === 354) {
        step = 8;
        const emailContent = [
          `From: "Desi Ride" <${user}>`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          ``,
          html,
          `.`,
          ``,
        ].join('\r\n');
        socket.write(emailContent);
      } else if (step === 8 && code === 250) {
        if (!resolved) {
          resolved = true;
          socket.write(`QUIT\r\n`);
          socket.end();
          resolve({ success: true, message: 'Delivered via SMTP' });
        }
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, error: err.message });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, error: 'SMTP connection timeout' });
      }
    });
  });
}
