import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/context/CustomerContext';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

const registerSchema = z.object({
  name: z.string().min(1, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "E-mail inválido" }),
  phone: z.string().min(1, { message: "Telefone é obrigatório" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

const CustomerAuth: React.FC = () => {
  const navigate = useNavigate();
  const { loginCustomer, registerCustomer, isLoading } = useCustomer();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    const success = await loginCustomer(values.email, values.password);
    
    if (success) {
      toast({
        title: "Login realizado",
        description: "Você foi autenticado com sucesso!",
      });
      navigate('/search');
    } else {
      toast({
        title: "Erro no login",
        description: "E-mail ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = values;
    const success = await registerCustomer(
      registerData.name,
      registerData.email,
      registerData.password,
      registerData.phone
    );
    
    if (success) {
      toast({
        title: "Cadastro realizado",
        description: "Sua conta foi criada com sucesso!",
      });
      navigate('/search');
    } else {
      toast({
        title: "Erro no cadastro",
        description: "Este e-mail já está em uso",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <Button variant="outline" onClick={() => navigate('/search')}>
            Voltar para busca
          </Button>
        </div>
      </div>
      
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </h2>
            <p className="mt-2 text-gray-600">
              {activeTab === "login" 
                ? "Acesse para agendar serviços" 
                : "Cadastre-se para agendar serviços"
              }
            </p>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
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
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Não tem uma conta?{" "}
                      <button
                        type="button"
                        className="text-[#0057B7] hover:underline"
                        onClick={() => setActiveTab("register")}
                      >
                        Cadastre-se
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="+XX XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Crie uma senha" 
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
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirme sua senha" 
                              {...field} 
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
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
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        className="text-[#0057B7] hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Entrar
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
