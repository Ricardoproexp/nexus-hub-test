
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/common/Logo';

type CompanyResult = {
  id: string;
  name: string;
  segment: 'barbearia' | 'cabeleireiro' | 'restaurante';
  address: string;
};

// This would be replaced with actual API calls in a real implementation
const mockCompanies: CompanyResult[] = [
  { id: '1', name: 'Barbearia Vintage', segment: 'barbearia', address: 'Rua das Flores, 123' },
  { id: '2', name: 'Salão Beleza Pura', segment: 'cabeleireiro', address: 'Av. Principal, 456' },
  { id: '3', name: 'Restaurante Sabor Caseiro', segment: 'restaurante', address: 'Praça Central, 789' }
];

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    // In a real app, this would be an API call
    setSearched(true);
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }
    
    const filteredResults = mockCompanies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filteredResults);
  };

  const getSegmentLabel = (segment: string) => {
    switch(segment) {
      case 'barbearia':
        return 'Barbearia';
      case 'cabeleireiro':
        return 'Cabeleireiro/Loja Física';
      case 'restaurante':
        return 'Restaurante';
      default:
        return segment;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <Button variant="outline" onClick={() => navigate('/registration')}>
            Registrar Empresa
          </Button>
        </div>
      </div>
      
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Encontre empresas</h1>
            <p className="text-lg text-gray-600">
              Pesquise por nome para agendar serviços em barbearias, cabeleireiros ou restaurantes
            </p>
          </div>
          
          <div className="flex gap-2 mb-8">
            <Input
              className="flex-grow"
              placeholder="Digite o nome da empresa"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} className="bg-[#0057B7] hover:bg-[#004494]">
              <SearchIcon className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
          
          {searched && (
            <div>
              {results.length > 0 ? (
                <div className="grid gap-4">
                  {results.map((company) => (
                    <Card key={company.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{company.name}</CardTitle>
                            <CardDescription>{getSegmentLabel(company.segment)}</CardDescription>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {getSegmentLabel(company.segment)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">{company.address}</p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-[#0057B7] hover:bg-[#004494]"
                          onClick={() => navigate(`/schedule/${company.id}`)}
                        >
                          Agendar serviço
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900">Nenhuma empresa encontrada</h3>
                  <p className="mt-1 text-gray-500">Tente mudar os termos da busca</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
