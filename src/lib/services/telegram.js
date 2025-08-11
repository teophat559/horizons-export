const SETTINGS_STORAGE_KEY = 'webAppSettings';

export const sendTelegramMessage = async (message) => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!savedSettings) {
      console.warn("Telegram settings not found in localStorage.");
      return { success: false, message: "Cài đặt Telegram chưa được cấu hình." };
    }

    const settings = JSON.parse(savedSettings);
    const { telegramToken, telegramChatId } = settings;

    if (!telegramToken || !telegramChatId) {
      console.warn("Telegram Token or Chat ID is missing.");
       return { success: false, message: "Token hoặc Chat ID của Telegram bị thiếu." };
    }

    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return { success: false, message: `Lỗi gửi tin nhắn Telegram: ${data.description}` };
    }
    
    return { success: true, message: "Gửi thông báo Telegram thành công." };

  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return { success: false, message: `Lỗi kết nối: ${error.message}` };
  }
};