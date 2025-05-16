
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const handleCustomerAuth = () => {
    onOpenChange(false);
    navigate('/customer/auth');
  };

  const handleCompanyRegistration = () => {
    onOpenChange(false);
    navigate('/registration');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Acesso ao Sistema</DialogTitle>
          <DialogDescription className="text-center">
            Escolha como deseja continuar
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            onClick={handleCustomerAuth} 
            className="w-full bg-[#0057B7] hover:bg-[#004494]"
            size="sm"
          >
            Cliente: Entrar / Cadastrar
          </Button>
          <Button 
            onClick={handleCompanyRegistration}
            variant="outline" 
            className="w-full"
            size="sm"
          >
            Empresa: Registrar Negócio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
