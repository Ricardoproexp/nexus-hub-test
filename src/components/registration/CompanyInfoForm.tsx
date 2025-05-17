
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from '@/hooks/use-toast';
import PasswordInput from './PasswordInput';
import ContactInfoFields from './ContactInfoFields';
import CompanyInfoFields from './CompanyInfoFields';

interface CompanyInfoFormProps {
  onNext: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome da empresa é obrigatório" }),
  cnpj: z.string().min(1, { message: "CNPJ é obrigatório" }),
  address: z.string().min(1, { message: "Endereço é obrigatório" }),
  phone: z.string().min(1, { message: "Telefone é obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ onNext }) => {
  const { company, updateCompany } = useCompany();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company.name || "",
      cnpj: company.cnpj || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { confirmPassword, ...companyData } = values;
    updateCompany(companyData);
    toast({
      title: "Informações salvas",
      description: "Seus dados foram salvos com sucesso!",
    });
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-6">Informações da Empresa</h2>
        
        <CompanyInfoFields control={form.control} />
        
        <ContactInfoFields control={form.control} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PasswordInput 
            control={form.control}
            name="password"
            label="Senha"
            placeholder="Senha para acesso"
          />
          
          <PasswordInput 
            control={form.control}
            name="confirmPassword"
            label="Confirmar Senha"
            placeholder="Confirme sua senha"
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit">
            Continuar
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyInfoForm;
