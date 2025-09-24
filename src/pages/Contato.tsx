import React from 'react';
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Contato: React.FC = () => {
  const contatos = [
    {
      tipo: 'WHATSAPP',
      numero: '(11) 95682-7562',
      icone: MessageCircle,
      acao: 'Iniciar chat',
      link: 'https://wa.me/5511956827562'
    },
    {
      tipo: 'TELEFONE',
      numero: '(11) 93864-6690',
      icone: Phone,
      acao: 'Ligar agora',
      link: 'tel:+5511938646690'
    }
  ];

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

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Contato</h1>

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <contato.icone className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contato.numero}</p>
                      </div>
                    </div>
                    
                    <Button 
                      asChild
                      className="font-bold text-foreground hover:bg-gray-100"
                      variant="ghost"
                    >
                      <a 
                        href={contato.link} 
                        target={contato.tipo === 'WHATSAPP' ? '_blank' : '_self'}
                        rel={contato.tipo === 'WHATSAPP' ? 'noopener noreferrer' : undefined}
                      >
                        {contato.acao}
                      </a>
                    </Button>
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
    </div>
  );
};

export default Contato;
