import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class WidgetController {
  @Get('widget.js')
  serveWidget(@Res() res: Response) {
    const host = 'https://ai-customer-support-backend-ldbf.onrender.com';

    const widgetCode = `
(function() {
  var WIDGET_HOST = '${host}';
  var WIDGET_CONFIG = window.AI_SUPPORT_CONFIG || {};

  var iframe = document.createElement('iframe');
  iframe.src = WIDGET_HOST + '/widget?company=' + encodeURIComponent(WIDGET_CONFIG.companyId || '') + '&theme=' + encodeURIComponent(WIDGET_CONFIG.theme || 'dark');
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:99999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);transition:all 0.3s ease;max-height:calc(100vh - 40px);max-width:calc(100vw - 40px);';
  iframe.id = 'ai-support-widget';

  var toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  toggleBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(59,130,246,0.4);z-index:100000;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';

  toggleBtn.onmouseenter = function() { this.style.transform = 'scale(1.1)'; };
  toggleBtn.onmouseleave = function() { this.style.transform = 'scale(1)'; };

  var isOpen = false;
  iframe.style.display = 'none';

  toggleBtn.onclick = function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    toggleBtn.innerHTML = isOpen
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  };

  document.body.appendChild(iframe);
  document.body.appendChild(toggleBtn);
})();
`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(widgetCode);
  }

  @Get('widget')
  serveWidgetPage(@Req() req: any, @Res() res: Response) {
    const host = 'https://ai-customer-support-backend-ldbf.onrender.com';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0f1a;color:#e2e8f0;height:100vh;display:flex;flex-direction:column}
    .header{padding:16px;background:#111827;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px}
    .header .logo{width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
    .header h3{font-size:14px;font-weight:600}
    .header .online{width:8px;height:8px;background:#22c55e;border-radius:50%;margin-left:auto}
    .messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
    .msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5}
    .msg.user{background:#3b82f6;color:white;align-self:flex-end;border-bottom-right-radius:4px}
    .msg.bot{background:#1e293b;color:#e2e8f0;align-self:flex-start;border-bottom-left-radius:4px}
    .input-bar{padding:12px;background:#111827;border-top:1px solid #1e293b;display:flex;gap:8px}
    .input-bar input{flex:1;padding:10px 14px;border:1px solid #1e293b;border-radius:8px;background:#0a0f1a;color:#e2e8f0;font-size:13px;outline:none}
    .input-bar input:focus{border-color:#3b82f6}
    .input-bar button{padding:10px 16px;background:#3b82f6;border:none;border-radius:8px;color:white;font-size:13px;cursor:pointer;font-weight:500}
    .input-bar button:hover{background:#2563eb}
    .typing{display:none;align-self:flex-start;padding:10px 14px;background:#1e293b;border-radius:12px}
    .typing span{display:inline-block;width:6px;height:6px;background:#64748b;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite}
    .typing span:nth-child(2){animation-delay:0.2s}.typing span:nth-child(3){animation-delay:0.4s}
    @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  </style>
</head>
<body>
  <div class="header"><div class="logo">💬</div><h3>AI Support</h3><div class="online"></div></div>
  <div class="messages" id="msgs">
    <div class="msg bot">Hi! How can I help you today?</div>
  </div>
  <div class="typing" id="typing"><span></span><span></span><span></span></div>
  <div class="input-bar">
    <input id="inp" placeholder="Type your message..." />
    <button id="send">Send</button>
  </div>
  <script>
    var WS = null;
    var CONV_ID = null;
    var COMPANY_ID = new URLSearchParams(location.search).get('company') || 'demo';

    function connect() {
      WS = new WebSocket('${host.replace('https', 'wss')}/ws?company=' + COMPANY_ID);
      WS.onmessage = function(e) {
        var d = JSON.parse(e.data);
        if (d.type === 'message') addMsg(d.content, 'bot');
        if (d.type === 'connected') CONV_ID = d.conversationId;
        document.getElementById('typing').style.display = 'none';
      };
    }

    function addMsg(text, who) {
      var m = document.createElement('div');
      m.className = 'msg ' + who;
      m.textContent = text;
      document.getElementById('msgs').appendChild(m);
      document.getElementById('msgs').scrollTop = 99999;
    }

    function send() {
      var inp = document.getElementById('inp');
      var text = inp.value.trim();
      if (!text) return;
      addMsg(text, 'user');
      inp.value = '';
      document.getElementById('typing').style.display = 'flex';
      WS.send(JSON.stringify({ type: 'chat', message: text, conversationId: CONV_ID, companyId: COMPANY_ID }));
    }

    document.getElementById('send').onclick = send;
    document.getElementById('inp').onkeydown = function(e) { if (e.key === 'Enter') send(); };
    connect();
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
