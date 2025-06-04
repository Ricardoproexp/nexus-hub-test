
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (url: string) => void;
  fallbackText: string;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarUpdate,
  fallbackText,
  size = 'md'
}) => {
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.');
      }

      // Validate file size (5MB)
      if (file.size > 5242880) {
        throw new Error('Arquivo muito grande. Tamanho máximo é 5MB.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath && oldPath.includes(user.id)) {
          await supabase.storage
            .from('company-avatars')
            .remove([`${user.id}/${oldPath.split('/').pop()}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('company-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('company-avatars')
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        throw new Error('Erro ao obter URL da imagem');
      }

      // Update company profile with new avatar URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(data.publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso!",
      });

    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} cursor-pointer transition-opacity group-hover:opacity-75`}>
          <AvatarImage src={currentAvatarUrl || undefined} alt="Avatar" />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={size === 'lg' ? 32 : 24} className="text-white drop-shadow-lg" />
        </div>
        
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">
          {uploading ? 'Carregando...' : 'Clique para alterar'}
        </p>
        <p className="text-xs text-gray-500">
          JPEG, PNG, WebP ou GIF (máx. 5MB)
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload;
