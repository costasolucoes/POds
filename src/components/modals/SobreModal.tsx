import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BaseModal from '@/components/BaseModal';

const SobreModal: React.FC = () => {
  return (
    <BaseModal title="Sobre Nós">
      <div className="p-6">
        {/* Informações da empresa */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Doutor Pods
              </h2>
              <p className="text-lg text-foreground">
                Lojas de Conveniência
              </p>
            </div>
            
            {/* Logo */}
            <div className="w-20 h-20 rounded-lg overflow-hidden">
              <img 
                src="https://i.postimg.cc/qqRSsTVq/doutor.png" 
                alt="O Doutor - Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Aviso de idade */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 font-bold text-sm">
                VENDA PROIBIDA PARA MENORES DE 18 ANOS
              </span>
              <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
            </div>
          </div>
        </div>

        {/* Texto sobre a empresa */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-foreground leading-relaxed">
              <p>
                Doutor Pods nasceu para transformar a experiência de quem busca uma alternativa nova. 
                Desde 2021, somos referência em qualidade, confiança e inovação no universo dos pods.
              </p>
              
              <p>
                Nosso compromisso é simples: oferecer praticidade, variedade de sabores e um 
                atendimento especializado para que cada cliente encontre o pod perfeito para o seu momento.
              </p>
              
              <p>
                Mais do que vender, construímos relações de fidelidade e satisfação. 
                Doutor Pods: cada puff, uma experiência única.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseModal>
  );
};

export default SobreModal;
