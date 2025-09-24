import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseModal from '@/components/BaseModal';

const ContatoModal: React.FC = () => {
  const contatos = [
    {
      tipo: 'WHATSAPP',
      numero: '(11) 95682-7562',
      icone: MessageCircle
    },
    {
      tipo: 'TELEFONE',
      numero: '(11) 93864-6690',
      icone: Phone
    }
  ];

  return (
    <BaseModal title="Contato">
      <div className="p-6">
        <div className="space-y-4">
          {contatos.map((contato, index) => (
            <div key={index}>
              {/* Cabeçalho da seção */}
              <div className="bg-gray-200 px-4 py-2">
                <h2 className="text-sm font-medium text-gray-700 uppercase">
                  {contato.tipo}
                </h2>
              </div>

              {/* Card do contato */}
              <Card className="rounded-none border-t-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <contato.icone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{contato.numero}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Informações adicionais */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Horário de Atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-foreground">
                <strong>Segunda a Sexta:</strong> 9h às 18h
              </p>
              <p className="text-foreground">
                <strong>Sábado:</strong> 9h às 14h
              </p>
              <p className="text-muted-foreground">
                <strong>Domingo:</strong> Fechado
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseModal>
  );
};

export default ContatoModal;
