
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import Button from '../common/Button';
import Card from '../common/Card';
import { Scissors, Utensils, Shopping } from 'lucide-react';

interface SegmentSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

const SegmentSelection: React.FC<SegmentSelectionProps> = ({ onNext, onBack }) => {
  const { company, updateCompany } = useCompany();

  const handleSegmentSelect = (segment: 'barbearia' | 'cabeleireiro' | 'restaurante') => {
    updateCompany({ segment });
  };

  const handleSubmit = () => {
    if (company.segment) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Selecione o Segmento da Sua Empresa</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => handleSegmentSelect('barbearia')}
          className="cursor-pointer"
        >
          <Card 
            highlighted={company.segment === 'barbearia'}
            className={`transition-all duration-200 hover:shadow-lg ${company.segment === 'barbearia' ? 'transform translate-y-[-4px]' : ''}`}
          >
            <div className="flex flex-col items-center p-4">
              <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-4">
                <Scissors size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Barbearia/Cabeleireiro</h3>
              <p className="text-sm text-gray-600 text-center">
                Gerenciamento para barbearias e salões de beleza
              </p>
            </div>
          </Card>
        </div>
        
        <div 
          onClick={() => handleSegmentSelect('cabeleireiro')}
          className="cursor-pointer"
        >
          <Card 
            highlighted={company.segment === 'cabeleireiro'}
            className={`transition-all duration-200 hover:shadow-lg ${company.segment === 'cabeleireiro' ? 'transform translate-y-[-4px]' : ''}`}
          >
            <div className="flex flex-col items-center p-4">
              <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-4">
                <Shopping size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Loja de Produtos</h3>
              <p className="text-sm text-gray-600 text-center">
                Sistema para lojas físicas de produtos diversos
              </p>
            </div>
          </Card>
        </div>
        
        <div 
          onClick={() => handleSegmentSelect('restaurante')}
          className="cursor-pointer"
        >
          <Card 
            highlighted={company.segment === 'restaurante'}
            className={`transition-all duration-200 hover:shadow-lg ${company.segment === 'restaurante' ? 'transform translate-y-[-4px]' : ''}`}
          >
            <div className="flex flex-col items-center p-4">
              <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-4">
                <Utensils size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Restaurante</h3>
              <p className="text-sm text-gray-600 text-center">
                Plataforma para gestão de restaurantes
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onBack}>
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!company.segment}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default SegmentSelection;
