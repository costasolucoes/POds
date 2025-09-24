import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseModal from '@/components/BaseModal';

const RastrearModal: React.FC = () => {
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const handleRastrear = () => {
    if (codigoRastreio.trim()) {
      setBuscaRealizada(true);
    }
  };

  return (
    <BaseModal title="Rastrear Pedido">
      <div className="p-6">
        {/* Busca de Rastreamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Digite o código de rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do pedido..."
                value={codigoRastreio}
                onChange={(e) => setCodigoRastreio(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleRastrear} disabled={!codigoRastreio.trim()}>
                Rastrear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do Rastreamento */}
        {buscaRealizada && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Pedido não encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  O código <strong>"{codigoRastreio}"</strong> não foi encontrado em nosso sistema.
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Verifique se o código está correto ou entre em contato conosco.</p>
                  <p>O código de rastreamento é enviado por email após a confirmação do pedido.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        {!buscaRealizada && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Digite o código de rastreamento para acompanhar seu pedido</p>
                <p className="text-sm mt-2">O código foi enviado por email após a confirmação do pedido</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseModal>
  );
};

export default RastrearModal;
