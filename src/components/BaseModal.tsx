import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';

interface BaseModalProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({ children, title, className = '' }) => {
  const { closeModal } = useModal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-background rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeModal}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 border border-red-500/20 hover:border-red-500/30 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
