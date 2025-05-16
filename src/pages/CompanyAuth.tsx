
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { toast } from '@/hooks/use-toast';
import { useCompany } from '@/context/CompanyContext';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'Senha é obrigatória' }),
});

const CompanyAuth: React.FC = () => {
  const navigate = useNavigate();
  const { loginCompany } = useCompany();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    
    try {
      const success = await loginCompany(values.email, values.password);
      
      if (success) {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo de volta!',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Falha no login',
          description: 'Email ou senha inválidos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao efetuar login',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto">
          <Logo />
        </div>
      </div>

      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border w-full max-w-md">
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-2xl font-bold">Acesso para Empresas</h1>
            <p className="text-gray-500 text-sm">Entre na sua conta para gerenciar seu negócio</p>
          </div>

          {/* Login Form */}
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="empresa@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Sua senha" 
                          {...field} 
                        />
                        <button 
                          type="button"
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[#0057B7] hover:bg-[#004494]" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Não tem uma conta? {' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => navigate('/registration')}
                  >
                    Registrar agora
                  </Button>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CompanyAuth;
