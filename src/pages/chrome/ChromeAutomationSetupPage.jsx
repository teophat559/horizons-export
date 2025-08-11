import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Terminal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ChromeAutomationSetupPage = () => {
  const { toast } = useToast();

  const agentCode = `
// == Local Agent Code (agent.js) ==
// Save this code as agent.js and run 'node agent.js' in your terminal.
// Make sure you have Node.js and npm installed.
// Run 'npm install socket.io-client puppeteer-core puppeteer' first.

const { Server } = require("socket.io");
const puppeteer = require('puppeteer-core');
const { exec } = require('child_process');

const io = new Server(3001, {
  cors: {
    origin: "*", // Allow all origins for simplicity
  },
});

console["log"]('Local agent started on port 3001. Waiting for connections...');

const findChromePath = () => {
  // Basic paths, adjust if your Chrome is installed elsewhere
  const paths = [
    '/usr/bin/google-chrome', // Linux
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    'C:\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe', // Windows
    'C:\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe' // Windows (x86)
  ];
  // This is a simplified check. A real implementation would be more robust.
  return paths.find(p => require('fs').existsSync(p)) || null;
};

const CHROME_PATH = findChromePath();
if (!CHROME_PATH) {
  console.error("Could not find Google Chrome executable. Please set CHROME_PATH manually.");
}

const openProfile = async (profileName, id) => {
  console["log"](\`Opening profile: \${profileName}\`);
  io.emit('status_update', { id, status: 'info', message: \`Opening profile \${profileName}\` });

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      userDataDir: \`./chrome-profiles/\${profileName}\`,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    // We don't close it, just open it for the user
    io.emit('status_update', { id, status: 'success', message: \`Profile \${profileName} opened.\` });
  } catch (e) {
    console.error(\`Failed to open profile \${profileName}: \`, e);
    io.emit('status_update', { id, status: 'error', message: \`Failed to open profile: \${e.message}\` });
  }
};

io.on("connection", (socket) => {
  console["log"](\`Client connected: \${socket.id}\`);

  socket.on("open_profiles", (profiles) => {
    console["log"]('Received open_profiles command for:', profiles);
    if (Array.isArray(profiles)) {
      profiles.forEach(p => openProfile(p.name, p.id));
    }
  });

  socket.on("start_login", (data) => {
    console["log"]('Received start_login command for:', data.account);
    // Placeholder for actual login logic
    io.emit('status_update', { id: data.id, status: 'info', message: 'Login process started...' });
    setTimeout(() => {
       io.emit('status_update', { id: data.id, status: 'success', message: 'Login successful (simulated).', cookie: 'simulated_cookie_value' });
    }, 5000);
  });

  socket.on("submit_otp", (data) => {
    console["log"]('Received submit_otp command for:', data.id);
    // Placeholder for actual OTP submission logic
    io.emit('status_update', { id: data.id, status: 'info', message: 'Submitting OTP...' });
     setTimeout(() => {
       io.emit('status_update', { id: data.id, status: 'success', message: 'OTP accepted (simulated).', cookie: 'updated_simulated_cookie' });
    }, 3000);
  });

  socket.on("refresh_profiles", (profiles) => {
    console["log"]('Received refresh_profiles command for:', profiles);
    // Placeholder for refresh logic
    if (Array.isArray(profiles)) {
      profiles.forEach(p => {
        io.emit('status_update', { id: p.id, status: 'info', message: \`Refreshing profile \${p.name}...\` });
      });
    }
  });

  socket.on("disconnect", () => {
    console["log"](\`Client disconnected: \${socket.id}\`);
  });
});
  `;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép!',
      description: 'Mã đã được sao chép vào clipboard.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Cài đặt Agent - Tự động hóa Chrome</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <Card className="cyber-card-bg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Terminal className="mr-3 text-green-400" />
              Cài đặt Agent Tự động hóa
            </CardTitle>
            <CardDescription className="text-gray-400">
              Làm theo các bước sau để chạy agent cục bộ trên máy tính của bạn, cho phép trang web này điều khiển trình duyệt Chrome.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400">Bước 1: Cài đặt môi trường</h3>
              <p className="text-gray-300">Bạn cần cài đặt <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Node.js</a> (phiên bản 18 trở lên) trên máy tính của bạn.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400">Bước 2: Cài đặt các thư viện cần thiết</h3>
              <p className="text-gray-300">Mở terminal (Command Prompt, PowerShell, hoặc Terminal) và chạy lệnh sau:</p>
              <div className="bg-black rounded-md p-4 flex items-center justify-between">
                <pre className="text-green-400 text-sm overflow-x-auto"><code>npm install socket.io puppeteer-core puppeteer</code></pre>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard('npm install socket.io puppeteer-core puppeteer')}>
                  <Copy className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400">Bước 3: Tạo và chạy file Agent</h3>
              <p className="text-gray-300">Sao chép đoạn mã dưới đây, lưu vào một file có tên là <code className="bg-gray-700 text-yellow-300 px-1 rounded">agent.js</code>, sau đó chạy nó bằng lệnh <code className="bg-gray-700 text-yellow-300 px-1 rounded">node agent.js</code> trong terminal.</p>
              <div className="bg-black rounded-md max-h-96 overflow-y-auto">
                <div className="p-4">
                  <pre className="text-green-400 text-sm whitespace-pre-wrap"><code>{agentCode.trim()}</code></pre>
                </div>
                <div className="sticky bottom-0 right-0 p-2 flex justify-end bg-black/50 backdrop-blur-sm">
                  <Button variant="secondary" size="sm" onClick={() => copyToClipboard(agentCode.trim())}>
                    <Copy className="mr-2 h-4 w-4" /> Sao chép mã
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-cyan-400">Bước 4: Hoàn tất</h3>
              <p className="text-gray-300">Nếu agent chạy thành công, bạn sẽ thấy thông báo "Local agent started on port 3001" trong terminal. Chỉ báo trạng thái Agent trên Bảng điều khiển sẽ chuyển sang màu xanh "Đã kết nối".</p>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default ChromeAutomationSetupPage;