
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search as SearchIcon, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/context/CustomerContext';
import Logo from '@/components/common/Logo';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
  { id: '3', name: 'Restaurante Sabor Caseiro', segment: 'restaurante', address: 'Praça Central, 789' },
  { id: '4', name: 'Barbearia Moderna', segment: 'barbearia', address: 'Rua dos Barros, 321' },
  { id: '5', name: 'Cabeleireiro Style', segment: 'cabeleireiro', address: 'Av. Fashion, 987' },
  { id: '6', name: 'Restaurante Italiano', segment: 'restaurante', address: 'Rua da Itália, 654' }
];

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const navigate = useNavigate();
  const { customer, logoutCustomer } = useCustomer();

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }
    
    const filteredResults = mockCompanies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filteredResults);
  }, [searchTerm]);

  const handleSearch = () => {
    setSearched(true);
  };

  const handleCompanySelect = (companyId: string) => {
    navigate(`/schedule/${companyId}`);
    setShowCommandMenu(false);
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
      <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <div className="flex gap-2">
            {customer ? (
              <div className="flex items-center gap-2">
                <div className="text-sm text-right">
                  <p className="font-medium text-xs">{customer.name}</p>
                  <p className="text-gray-500 text-xs">{customer.email}</p>
                </div>
                <div className="relative group">
                  <Button variant="ghost" className="rounded-full p-1 h-8 w-8">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                  <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
                    <button 
                      onClick={() => logoutCustomer()}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button size="xs" onClick={() => navigate('/customer/auth')}>
                Entrar / Cadastrar
              </Button>
            )}
            <Button size="xs" variant="outline" onClick={() => navigate('/registration')}>
              Registrar Empresa
            </Button>
          </div>
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
          
          <div className="relative">
            <div className="flex gap-2 mb-8">
              <div className="flex-grow relative">
                <Input
                  className="flex-grow"
                  placeholder="Digite o nome da empresa"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowCommandMenu(e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                      setShowCommandMenu(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchTerm.length > 0) {
                      setShowCommandMenu(true);
                    }
                  }}
                />
                {showCommandMenu && searchTerm.trim() !== '' && (
                  <div className="absolute z-10 w-full mt-1">
                    <Command className="rounded-lg border shadow-md">
                      <CommandList>
                        <CommandEmpty>Nenhuma empresa encontrada</CommandEmpty>
                        <CommandGroup heading="Empresas">
                          {results.map((company) => (
                            <CommandItem
                              key={company.id}
                              onSelect={() => handleCompanySelect(company.id)}
                              className="flex justify-between items-center cursor-pointer"
                            >
                              <div>
                                <p className="font-medium">{company.name}</p>
                                <p className="text-sm text-gray-500">{company.address}</p>
                              </div>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {getSegmentLabel(company.segment)}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>
              <Button 
                onClick={() => {
                  handleSearch();
                  setShowCommandMenu(false);
                }} 
                className="bg-[#0057B7] hover:bg-[#004494]"
              >
                <SearchIcon className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
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
                            <CardDescription>{company.address}</CardDescription>
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
