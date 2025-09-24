import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BaseModal from '@/components/BaseModal';

const TermosModal: React.FC = () => {
  return (
    <BaseModal title="Termos e Políticas de Doutor Pods">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Políticas de Privacidade */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Políticas de Privacidade
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Publicado em 23/11/2023
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-lg">
                Coletamos somente os dados necessários para realizar a entrega.
              </p>
            </CardContent>
          </Card>

          {/* Termos de Uso */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Termos de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  1. Aceitação dos Termos
                </h3>
                <p className="text-muted-foreground">
                  Ao utilizar nossos serviços, você concorda com estes termos e condições. 
                  Se não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  2. Produtos e Serviços
                </h3>
                <p className="text-muted-foreground">
                  Oferecemos produtos de conveniência, incluindo pods e acessórios relacionados. 
                  Todos os produtos são destinados exclusivamente para maiores de 18 anos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  3. Idade Mínima
                </h3>
                <p className="text-muted-foreground">
                  É proibida a venda para menores de 18 anos. Ao fazer uma compra, 
                  você declara ter mais de 18 anos de idade.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  4. Privacidade e Dados
                </h3>
                <p className="text-muted-foreground">
                  Coletamos apenas os dados necessários para processar e entregar seu pedido. 
                  Seus dados pessoais são protegidos e não serão compartilhados com terceiros 
                  sem seu consentimento, exceto quando necessário para a entrega.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  5. Entregas
                </h3>
                <p className="text-muted-foreground">
                  Realizamos entregas para todo o Brasil. Os prazos de entrega 
                  são estimativas e podem variar conforme a localização e disponibilidade.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  6. Contato
                </h3>
                <p className="text-muted-foreground">
                  Para dúvidas sobre estes termos, entre em contato conosco através dos 
                  canais disponíveis na página de contato.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Política de Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Política de Cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para o funcionamento do site e para melhorar 
                sua experiência de navegação. Ao continuar navegando, você concorda com o uso de cookies.
              </p>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-foreground">
                  <strong>Empresa:</strong> Doutor Pods
                </p>
                <p className="text-foreground">
                  <strong>Atividade:</strong> Lojas de Conveniência
                </p>
                <p className="text-foreground">
                  <strong>WhatsApp:</strong> (11) 95682-7562
                </p>
                <p className="text-foreground">
                  <strong>Telefone:</strong> (11) 93864-6690
                </p>
                <p className="text-muted-foreground text-sm mt-4">
                  Última atualização: 23/11/2023
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BaseModal>
  );
};

export default TermosModal;
