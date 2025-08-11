import React from 'react';
import UploadImageForm from '@/components/UploadImageForm';

export default function UploadPage() {
  return (
    <div className="container mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Tải ảnh lên</h1>
      <UploadImageForm />
      <p className="text-sm text-muted-foreground mt-3">Sau khi tải, bạn sẽ nhận URL dạng /uploads/xxx. Dùng URL đó để gán vào ảnh thí sinh.</p>
    </div>
  );
}
