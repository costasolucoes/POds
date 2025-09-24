import { useNavigate } from "react-router-dom";

type CartItem = { id: string; name: string; price: number; quantity: number };

export default function CheckoutButton({ cart }: { cart: CartItem[] }) {
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <button 
      onClick={handleCheckout} 
      className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-bold text-center hover:bg-green-700 transition-colors"
    >
      Completar minhas Informações de entrega
    </button>
  );
}
