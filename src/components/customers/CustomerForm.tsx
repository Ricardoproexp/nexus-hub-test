
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface CustomerFormProps {
  customer?: any;
  onSaved: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: z.string().optional(),
});

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSaved, onCancel }) => {
  const { company } = useCompany();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
    },
  });
  
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || '',
      });
    }
  }, [customer, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!company.id) {
        throw new Error('Empresa não identificada');
      }

      // Construir objeto para salvar
      const customerData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
      };
      
      if (customer?.id) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);
        
        if (error) throw error;
        
        toast({
          title: 'Cliente atualizado',
          description: 'O cliente foi atualizado com sucesso',
        });
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('customers')
          .insert(customerData);
        
        if (error) throw error;
        
        toast({
          title: 'Cliente criado',
          description: 'O cliente foi criado com sucesso',
        });
      }
      
      onSaved();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {customer?.id ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default CustomerForm;
