import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import RastrearModal from './modals/RastrearModal';
import ContatoModal from './modals/ContatoModal';
import SobreModal from './modals/SobreModal';
import TermosModal from './modals/TermosModal';

const ModalManager: React.FC = () => {
  const { activeModal } = useModal();

  return (
    <>
      {activeModal === 'rastrear' && <RastrearModal />}
      {activeModal === 'contato' && <ContatoModal />}
      {activeModal === 'sobre' && <SobreModal />}
      {activeModal === 'termos' && <TermosModal />}
    </>
  );
};

export default ModalManager;
