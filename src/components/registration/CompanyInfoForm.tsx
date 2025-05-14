
import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCompany } from '@/context/CompanyContext';

interface CompanyInfoFormProps {
  onNext: () => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ onNext }) => {
  const { company, updateCompany } = useCompany();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!company.name) newErrors.name = 'Nome da empresa é obrigatório';
    if (!company.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!company.address) newErrors.address = 'Endereço é obrigatório';
    if (!company.phone) newErrors.phone = 'Telefone é obrigatório';
    if (!company.email) newErrors.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(company.email)) newErrors.email = 'E-mail inválido';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Informações da Empresa</h2>
      
      <Input
        label="Nome da Empresa"
        value={company.name}
        onChange={(e) => updateCompany({ name: e.target.value })}
        placeholder="Insira o nome da sua empresa"
        error={errors.name}
        required
      />
      
      <Input
        label="CNPJ"
        value={company.cnpj}
        onChange={(e) => updateCompany({ cnpj: e.target.value })}
        placeholder="XX.XXX.XXX/XXXX-XX"
        error={errors.cnpj}
        required
      />
      
      <Input
        label="Endereço"
        value={company.address}
        onChange={(e) => updateCompany({ address: e.target.value })}
        placeholder="Rua, número, bairro, cidade/UF"
        error={errors.address}
        required
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Telefone"
          value={company.phone}
          onChange={(e) => updateCompany({ phone: e.target.value })}
          placeholder="(XX) XXXXX-XXXX"
          error={errors.phone}
          required
        />
        
        <Input
          label="E-mail de Contato"
          type="email"
          value={company.email}
          onChange={(e) => updateCompany({ email: e.target.value })}
          placeholder="contato@suaempresa.com.br"
          error={errors.email}
          required
        />
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
};

export default CompanyInfoForm;
