const os = require('os');
const pkg = require('../../package.json');

const getDashboardHtml = (port, dbStatus = 'Connected') => {
  const uptime = process.uptime();
  const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevInsight AI Backend Platform</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root {
          --bg-dark: #0f172a;
          --bg-card: rgba(30, 41, 59, 0.7);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --accent: #3b82f6;
          --success: #10b981;
          --warning: #f59e0b;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--bg-dark);
          color: var(--text-primary);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.15), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15), transparent 25%);
          overflow: hidden;
        }

        .container {
          max-width: 900px;
          width: 90%;
          z-index: 10;
          animation: slideUp 0.8s forwards;
          opacity: 0;
          transform: translateY(40px);
        }

        .glass-panel {
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        header { text-align: center; margin-bottom: 40px; }

        h1 {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(to right, #60a5fa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }

        p.subtitle { color: var(--text-secondary); font-size: 1.1rem; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255,255,255,0.1);
        }

        .stat-icon { font-size: 2rem; margin-bottom: 15px; }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-dot {
          width: 8px; height: 8px;
          background-color: var(--success);
          border-radius: 50%;
          margin-right: 8px;
          box-shadow: 0 0 10px var(--success);
          animation: pulse 2s infinite;
        }

        .endpoints {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 20px;
        }

        .endpoints h3 { margin-bottom: 15px; color: #cbd5e1; }

        .endpoint-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .endpoint-item:last-child { border-bottom: none; }

        .method {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          margin-right: 15px;
        }

        .path { font-family: 'JetBrains Mono', monospace; color: #e2e8f0; }

        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .particles {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 1; pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="particles" id="particles"></div>
      
      <div class="container">
        <div class="glass-panel">
          <header>
            <div class="status-badge" style="margin-bottom: 20px;">
              <span class="status-dot"></span>
              SYSTEM ONLINE
            </div>
            <h1>DevInsight AI Backend</h1>
            <p class="subtitle">Next-Generation Analytics & Intelligence Core (v${pkg.version})</p>
          </header>

          <div class="grid">
            <div class="stat-card">
              <div class="stat-icon">⚡</div>
              <div class="stat-value">${uptimeFormatted}</div>
              <div class="stat-label">Uptime</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🧠</div>
              <div class="stat-value">${usedMem} / ${totalMem} GB</div>
              <div class="stat-label">Memory Usage</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🔌</div>
              <div class="stat-value">${port}</div>
              <div class="stat-label">Active Port</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🗄️</div>
              <div class="stat-value" style="color: ${dbStatus === 'Connected' ? 'var(--success)' : 'var(--warning)'}">${dbStatus}</div>
              <div class="stat-label">Database Status</div>
            </div>
          </div>

          <div class="endpoints">
            <h3>Quick Links & API Routes</h3>
            <div>
              <div class="endpoint-item">
                <div>
                  <span class="method">GET</span>
                  <a href="/health" class="path" style="text-decoration:none">/health</a>
                </div>
                <span style="color:var(--text-secondary)">System Health Check</span>
              </div>
              <div class="endpoint-item">
                <div>
                  <span class="method">GET</span>
                  <a href="/api/system-monitor" class="path" style="text-decoration:none">/api/system-monitor</a>
                </div>
                <span style="color:var(--text-secondary)">Real-time Metrics (Wow Feature #2)</span>
              </div>
              <div class="endpoint-item">
                <div>
                  <span class="method">USE</span>
                  <span class="path">/api/auth/*</span>
                </div>
                <span style="color:var(--text-secondary)">Authentication Routes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script>
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 30; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.width = Math.random() * 4 + 'px';
          particle.style.height = particle.style.width;
          particle.style.background = 'rgba(255,255,255,' + (Math.random() * 0.3) + ')';
          particle.style.borderRadius = '50%';
          particle.style.left = Math.random() * 100 + 'vw';
          particle.style.top = Math.random() * 100 + 'vh';
          particle.style.animation = 'float ' + (Math.random() * 10 + 10) + 's linear infinite';
          particlesContainer.appendChild(particle);
        }

        const style = document.createElement('style');
        style.innerHTML = "@keyframes float { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; } }";
        document.head.appendChild(style);
      </script>
    </body>
    </html>
  `;
  return html;
};

module.exports = getDashboardHtml;
