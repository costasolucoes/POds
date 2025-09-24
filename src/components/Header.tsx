import React, { useState } from 'react';
import { Search, Menu, Phone, Info, FileText, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useModal } from '@/contexts/ModalContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// === CONTROLES RÁPIDOS ===
const ICON_PX = 32;                     // tamanho visual dos ícones (px)
const TAP_CLASSES = 'w-12 h-12';        // área de toque (48px)
const ICON_STYLE: React.CSSProperties = { width: ICON_PX, height: ICON_PX };

type ModalKey = 'rastrear' | 'contato' | 'sobre' | 'termos';

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openModal } = useModal();

  const menuItems: { icon: React.ComponentType<any>; label: string; modal: ModalKey }[] = [
    { icon: Truck,    label: 'Rastrear meu pedido', modal: 'rastrear' },
    { icon: Phone,    label: 'Contato',             modal: 'contato'  },
    { icon: Info,     label: 'Sobre nós',           modal: 'sobre'    },
    { icon: FileText, label: 'Termos e políticas',  modal: 'termos'   },
  ];

  return (
    <>
      {/* ↑ aumentei a altura base do herói: */}
      <header className="relative min-h-[140px] md:min-h-[240px]">
      {/* Banner de fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://i.postimg.cc/0jpHvysz/Whats-App-Image-2025-09-22-at-13-46-17.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60" />
      </div>

      {/* Conteúdo (mais padding embaixo p/ dar altura) */}
      <div className="relative z-10 px-2 pt-3 pb-16 md:pb-24">
        <div className="flex justify-end w-full">
          {/* canto superior direito */}
          <div className="flex items-start space-x-2 md:space-x-4">
            {/* Busca desktop */}
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0"
                style={{ width: 24, height: 24 }}
                strokeWidth={2.8}
                aria-hidden
              />
              <Input
                placeholder="Pesquisar produtos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 w-72 bg-white/80 border-white/20 focus:bg-white focus:border-white/40"
                aria-label="Pesquisar produtos"
              />
            </div>

            {/* Botão de busca (MOBILE) — menos branco, circular e com blur leve */}
            <Button
              variant="ghost"
              className={`md:hidden text-white ${TAP_CLASSES} rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-none`}
              aria-label="Abrir pesquisa"
              title="Pesquisar"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search style={ICON_STYLE} className="shrink-0" strokeWidth={3} />
            </Button>

            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-6">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="text-white hover:bg-white/15"
                  onClick={() => openModal(item.modal)}
                >
                  <item.icon className="mr-2 shrink-0" style={{ width: 20, height: 20 }} />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Menu mobile — trigger com fundo mais sutil também */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className={`md:hidden text-white ${TAP_CLASSES} rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-none`}
                  aria-label="Abrir menu"
                  title="Menu"
                >
                  <Menu style={ICON_STYLE} className="shrink-0" strokeWidth={3} />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* Itens do menu */}
                  <div className="space-y-2">
                    {menuItems.map((item, index) => (
          <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          openModal(item.modal);
                          setIsMenuOpen(false);
                        }}
                      >
                        <item.icon className="mr-3 shrink-0" style={{ width: 22, height: 22 }} />
                        {item.label}
                      </Button>
                    ))}
                  </div>

                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>

        {/* Modal de Pesquisa Mobile */}
        {isSearchOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0"
                      style={{ width: 20, height: 20 }}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <Input
                      placeholder="Pesquisar produtos..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsSearchOpen(false);
                        }
                      }}
                      className="pl-10 pr-4"
                      autoFocus
                      aria-label="Pesquisar produtos"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
  );
};

export default Header;
