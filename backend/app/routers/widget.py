"""
Website Chat Widget endpoints.
Serves embeddable chat widget for websites.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/widget", tags=["Widget"])


@router.get("/embed.js")
async def widget_embed_script(bot_id: str):
    """Returns the JavaScript embed code for the chat widget."""
    backend_url = settings.BACKEND_URL
    script = f"""
(function() {{
  if (window.__areabotLoaded) return;
  window.__areabotLoaded = true;

  var iframe = document.createElement('iframe');
  iframe.id = 'areabot-widget';
  iframe.src = '{backend_url}/widget/chat?bot_id={bot_id}';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:999999;display:none;';

  var btn = document.createElement('div');
  btn.id = 'areabot-toggle';
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#00e5cc;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,229,204,0.4);z-index:999998;transition:transform 0.2s;';
  btn.onmouseenter = function() {{ this.style.transform = 'scale(1.1)'; }};
  btn.onmouseleave = function() {{ this.style.transform = 'scale(1)'; }};

  var open = false;
  btn.onclick = function() {{
    open = !open;
    iframe.style.display = open ? 'block' : 'none';
    btn.style.display = open ? 'none' : 'flex';
  }};

  window.addEventListener('message', function(e) {{
    if (e.data === 'areabot-close') {{
      open = false;
      iframe.style.display = 'none';
      btn.style.display = 'flex';
    }}
  }});

  document.body.appendChild(iframe);
  document.body.appendChild(btn);
}})();
"""
    return HTMLResponse(content=script, media_type="application/javascript")


@router.get("/chat")
async def widget_chat_page(bot_id: str, db: Session = Depends(get_db)):
    """Serves the chat widget HTML page inside the iframe."""
    bot = db.query(models.Bot).filter(
        models.Bot.id == bot_id, models.Bot.is_active == True
    ).first()
    if not bot:
        return HTMLResponse("<h3>Bot not found</h3>", status_code=404)

    backend_url = settings.BACKEND_URL
    bot_name = bot.bot_name or "Assistant"
    greeting = bot.greeting_message or f"สวัสดีครับ! ผม {bot_name} ยินดีให้บริการครับ"

    html = f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{bot_name}</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1a; color: #e2f0f8; height: 100vh; display: flex; flex-direction: column; }}
  .header {{ background: linear-gradient(135deg, #0d1b2a, #1b2838); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,229,204,0.2); }}
  .header h3 {{ font-size: 15px; color: #00e5cc; }}
  .close-btn {{ background: none; border: none; color: #888; cursor: pointer; font-size: 20px; }}
  .messages {{ flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }}
  .msg {{ max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }}
  .msg.bot {{ background: #1b2838; align-self: flex-start; border-bottom-left-radius: 4px; }}
  .msg.user {{ background: #00e5cc; color: #000; align-self: flex-end; border-bottom-right-radius: 4px; }}
  .msg.typing {{ background: #1b2838; align-self: flex-start; }}
  .msg.typing span {{ display: inline-block; width: 8px; height: 8px; background: #00e5cc; border-radius: 50%; margin: 0 2px; animation: bounce 1.4s infinite ease-in-out; }}
  .msg.typing span:nth-child(2) {{ animation-delay: 0.2s; }}
  .msg.typing span:nth-child(3) {{ animation-delay: 0.4s; }}
  @keyframes bounce {{ 0%,80%,100% {{ transform: scale(0); }} 40% {{ transform: scale(1); }} }}
  .input-area {{ padding: 12px; border-top: 1px solid rgba(0,229,204,0.2); display: flex; gap: 8px; background: #0d1b2a; }}
  .input-area input {{ flex: 1; background: #1b2838; border: 1px solid rgba(0,229,204,0.2); border-radius: 8px; padding: 10px 14px; color: #e2f0f8; font-size: 14px; outline: none; }}
  .input-area input:focus {{ border-color: #00e5cc; }}
  .input-area button {{ background: #00e5cc; color: #000; border: none; border-radius: 8px; padding: 10px 16px; font-weight: 600; cursor: pointer; }}
  .input-area button:disabled {{ opacity: 0.5; cursor: not-allowed; }}
  .powered {{ text-align: center; font-size: 11px; color: #555; padding: 6px; }}
</style>
</head>
<body>
<div class="header">
  <h3>{bot_name}</h3>
  <button class="close-btn" onclick="parent.postMessage('areabot-close','*')">&times;</button>
</div>
<div class="messages" id="messages">
  <div class="msg bot">{greeting}</div>
</div>
<div class="input-area">
  <input type="text" id="input" placeholder="พิมพ์ข้อความ..." onkeydown="if(event.key==='Enter')sendMsg()">
  <button id="sendBtn" onclick="sendMsg()">ส่ง</button>
</div>
<div class="powered">Powered by AreaBot</div>
<script>
const API = '{backend_url}/v1/chat/completions';
const API_KEY = '{bot.api_key}';
let history = [];

function addMsg(text, role) {{
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  div.textContent = text;
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({{ behavior: 'smooth' }});
}}

function showTyping() {{
  const div = document.createElement('div');
  div.className = 'msg typing';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({{ behavior: 'smooth' }});
}}

function hideTyping() {{
  const el = document.getElementById('typing');
  if (el) el.remove();
}}

async function sendMsg() {{
  const input = document.getElementById('input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  addMsg(text, 'user');
  history.push({{ role: 'user', content: text }});

  document.getElementById('sendBtn').disabled = true;
  showTyping();

  try {{
    const res = await fetch(API, {{
      method: 'POST',
      headers: {{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'X-Platform': 'api',
        'X-User-Id': 'widget-' + Math.random().toString(36).substr(2, 9),
      }},
      body: JSON.stringify({{ model: 'gpt-4o', messages: history }})
    }});
    const data = await res.json();
    const reply = data.choices[0].message.content;
    hideTyping();
    addMsg(reply, 'bot');
    history.push({{ role: 'assistant', content: reply }});
  }} catch(e) {{
    hideTyping();
    addMsg('ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่', 'bot');
  }}
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}}
</script>
</body>
</html>"""
    return HTMLResponse(content=html)
