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
  toggleBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:#14181e;border:1px solid rgba(255,255,255,0.18);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.28);z-index:100000;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';

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
    body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#0d1117;color:#e6e6e3;height:100vh;display:flex;flex-direction:column;font-size:14px}
    .header{padding:12px 14px;background:#11161d;border-bottom:1px solid #1e242c;display:flex;align-items:center;gap:10px}
    .header .logo{width:26px;height:26px;border:1px solid #2a333f;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#9fb0a8}
    .header h3{font-size:13px;font-weight:600}
    .header .sub{font-size:11px;color:#7d8792}
    .header .online{width:7px;height:7px;background:#3f9c6d;border-radius:50%;margin-left:auto}
    .messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
    .msg{max-width:85%;padding:9px 12px;border-radius:10px;font-size:13px;line-height:1.55;white-space:pre-wrap}
    .msg.user{background:#12402f;color:#e8f2ec;align-self:flex-end;border-bottom-right-radius:3px}
    .msg.bot{background:#171c23;color:#e6e6e3;align-self:flex-start;border-bottom-left-radius:3px}
    .input-bar{padding:10px 12px;background:#11161d;border-top:1px solid #1e242c;display:flex;gap:8px}
    .input-bar input{flex:1;padding:9px 12px;border:1px solid #262e38;border-radius:8px;background:#0d1117;color:#e6e6e3;font-size:13px;outline:none}
    .input-bar input:focus{border-color:#3f9c6d}
    .input-bar button{padding:9px 14px;background:#e6e6e3;border:none;border-radius:8px;color:#14161a;font-size:13px;cursor:pointer;font-weight:600}
    .input-bar button:hover{background:#ffffff}
    .typing{display:none;align-self:flex-start;padding:9px 12px;background:#171c23;border-radius:10px}
    .typing span{display:inline-block;width:5px;height:5px;background:#69737d;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite}
    .typing span:nth-child(2){animation-delay:0.2s}.typing span:nth-child(3){animation-delay:0.4s}
    @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">SA</div>
    <div>
      <h3>AI Support</h3>
      <div class="sub" id="status">Usually replies instantly</div>
    </div>
    <div class="online" aria-hidden="true"></div>
  </div>
  <div class="messages" id="msgs" role="log" aria-live="polite">
    <div class="msg bot">Hi! I can look up your order, open a ticket, or answer from the company knowledge base. What do you need?</div>
  </div>
  <div class="typing" id="typing"><span></span><span></span><span></span></div>
  <div class="input-bar">
    <input id="inp" placeholder="Type your message..." maxlength="2000" aria-label="Message" />
    <button id="send">Send</button>
  </div>
  <script>
    var WS = null;
    var CONV_ID = null;
    var COMPANY_ID = new URLSearchParams(location.search).get('company') || 'demo';

    function connect() {
      WS = new WebSocket('${host.replace('https', 'wss')}/ws?company=' + encodeURIComponent(COMPANY_ID));
      WS.onopen = function() { document.getElementById('status').textContent = 'Online'; };
      WS.onclose = function() {
        document.getElementById('status').textContent = 'Reconnecting...';
        setTimeout(connect, 1500);
      };
      WS.onmessage = function(e) {
        var d = JSON.parse(e.data);
        if (d.type === 'message') {
          if (d.conversationId) CONV_ID = d.conversationId;
          addMsg(d.content, 'bot');
        }
        if (d.type === 'error') addMsg(d.content, 'bot');
        document.getElementById('typing').style.display = 'none';
      };
    }

    function addMsg(text, who) {
      var m = document.createElement('div');
      m.className = 'msg ' + who;
      m.textContent = text;
      var box = document.getElementById('msgs');
      box.appendChild(m);
      box.scrollTop = box.scrollHeight;
    }

    function send() {
      var inp = document.getElementById('inp');
      var text = inp.value.trim().slice(0, 2000);
      if (!text) return;
      if (!WS || WS.readyState !== 1) { addMsg('Still connecting — try again in a second.', 'bot'); return; }
      addMsg(text, 'user');
      inp.value = '';
      document.getElementById('typing').style.display = 'flex';
      WS.send(JSON.stringify({ event: 'chat', data: { message: text, conversationId: CONV_ID } }));
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
