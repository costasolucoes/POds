import React from 'react';
import { CheckCircle, Package, Truck, Heart } from 'lucide-react';

const Obrigado: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de sucesso */}
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Obrigado pelo seu pedido! 🎉
        </h1>

        {/* Subtítulo */}
        <p className="text-lg text-gray-600 mb-6">
          Seu pagamento foi processado com sucesso e seu pedido está sendo preparado.
        </p>

        {/* Status do pedido */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Package className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-semibold">Pedido Confirmado</span>
          </div>
          <p className="text-green-700 text-sm">
            Você receberá um e-mail de confirmação em breve.
          </p>
        </div>

        {/* Próximos passos */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Próximos passos:
          </h3>
          
          <div className="flex items-start space-x-3 text-left">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Preparação do pedido</p>
              <p className="text-gray-500 text-sm">Seus produtos estão sendo separados</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-left">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Envio</p>
              <p className="text-gray-500 text-sm">Seu pedido será despachado em breve</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-left">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Entrega</p>
              <p className="text-gray-500 text-sm">Você receberá seu pedido em casa</p>
            </div>
          </div>
        </div>


        {/* Botão para voltar */}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Continuar Comprando
        </button>

        {/* Agradecimento */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <Heart className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-gray-600 text-sm">
              Obrigado por escolher nossa loja!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Obrigado;
