import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TEMPLATES_STORAGE_KEY = 'notificationTemplatesList';

const SendNotificationDialog = ({ isOpen, onOpenChange, onSend }) => {
  const [formData, setFormData] = useState({ type: 'info', message: '' });
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error("Failed to load notification templates", error);
      }
      // Reset form on open
      setFormData({ type: 'info', message: '' });
    }
  }, [isOpen]);

  const handleTemplateSelect = (templateId) => {
    const selectedTemplate = templates.find(t => t.id.toString() === templateId);
    if (selectedTemplate) setFormData(prev => ({ ...prev, message: selectedTemplate.message }));
  };

  const handleSubmit = () => {
    onSend(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0f0c29] border-purple-800 text-slate-50">
        <DialogHeader>
          <DialogTitle className="text-white">Gửi Thông Báo Mới</DialogTitle>
          <DialogDescription className="text-slate-400">
            Soạn và gửi một cảnh báo mới đến hệ thống.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template" className="text-slate-400">Chọn Mẫu (Tùy chọn)</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Chọn một mẫu có sẵn" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-slate-400">Loại Thông Báo</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c29] border-purple-800 text-slate-50">
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-slate-400">Nội dung</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} type="submit" className="glowing-button-cyber">Gửi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationDialog;