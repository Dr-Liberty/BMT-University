import { useState } from 'react';
import CertificateModal from '../CertificateModal';
import { Button } from '@/components/ui/button';

// todo: remove mock functionality
const mockCertificate = {
  id: '1',
  courseName: 'Introduction to Kaspa Blockchain',
  studentName: '0x7a3B...9f2C',
  completionDate: 'December 3, 2025',
  txHash: '0x8f7e6d5c4b3a2190f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a',
  reward: 500,
};

export default function CertificateModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8 bg-background">
      <Button onClick={() => setOpen(true)}>View Certificate</Button>
      <CertificateModal
        certificate={mockCertificate}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
