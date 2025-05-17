
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

interface ServiceFormProps {
  service?: any;
  onSaved: () => void;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSaved, onCancel }) => {
  const { company } = useCompany();
  const { toast } = useToast();
  
  // Schema adaptado conforme o segmento da empresa
  const getFormSchema = () => {
    const baseSchema = {
      name: z.string().min(1, 'Nome é obrigatório'),
      duration: z.coerce.number().min(1, 'Duração é obrigatória'),
      price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
    };
    
    // Restaurantes geralmente não têm duração fixa para itens do cardápio
    if (company.segment === 'restaurante') {
      return z.object({
        name: baseSchema.name,
        price: baseSchema.price,
        duration: z.coerce.number().default(0), // Mais para compatibilidade do banco
      });
    }
    
    // Esquema padrão para outros segmentos
    return z.object(baseSchema);
  };

  const formSchema = getFormSchema();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name || '',
      price: service?.price || 0,
      duration: service?.duration || 30,
    },
  });
  
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        price: service.price || 0,
        duration: service.duration || 30,
      });
    }
  }, [service, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!company.id) {
        throw new Error('Empresa não identificada');
      }

      // Construir objeto para salvar
      const serviceData = {
        company_id: company.id,
        name: values.name,
        price: values.price,
        duration: values.duration
      };
      
      if (service?.id) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
        
        if (error) throw error;
        
        toast({
          title: 'Serviço atualizado',
          description: 'O serviço foi atualizado com sucesso',
        });
      } else {
        // Criar novo serviço
        const { error } = await supabase
          .from('services')
          .insert(serviceData);
        
        if (error) throw error;
        
        toast({
          title: 'Serviço criado',
          description: 'O serviço foi criado com sucesso',
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

  const getFieldLabel = (field: string) => {
    if (company.segment === 'restaurante') {
      switch (field) {
        case 'name': return 'Nome do Item';
        case 'price': return 'Preço (€)';
        case 'duration': return 'Tempo médio de preparo (min)';
        default: return field;
      }
    } else {
      switch (field) {
        case 'name': return 'Nome do Serviço';
        case 'price': return 'Preço (€)';
        case 'duration': return 'Duração (min)';
        default: return field;
      }
    }
  };

  const showDuration = company.segment !== 'restaurante';

  const getTitle = () => {
    if (service?.id) {
      return company.segment === 'restaurante' ? 'Editar Item do Cardápio' : 'Editar Serviço';
    }
    return company.segment === 'restaurante' ? 'Novo Item do Cardápio' : 'Novo Serviço';
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">{getTitle()}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getFieldLabel('name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getFieldLabel('price')}</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {showDuration && (
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getFieldLabel('duration')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
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

export default ServiceForm;
