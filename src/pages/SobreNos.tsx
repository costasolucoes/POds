import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SobreNos: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-black text-white p-4">
        <div className="container mx-auto flex items-center">
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Título da seção */}
      <div className="bg-gray-200 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-700 uppercase text-center">
            SOBRE NÓS
          </h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
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
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-sm font-bold">DOUTOR PODS</div>
                <div className="text-xs">X O X</div>
              </div>
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
    </div>
  );
};

export default SobreNos;
