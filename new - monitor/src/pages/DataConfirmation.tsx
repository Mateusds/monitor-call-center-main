import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Check, 
  Pencil, 
  X, 
  User, 
  Phone, 
  Mail, 
  FileText,
  CreditCard,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  motivo: string;
}

export default function DataConfirmation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<keyof UserData | null>(null);
  
  // Dados simulados - em produção viriam de um formulário anterior ou contexto
  const [userData, setUserData] = useState<UserData>({
    nome: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    telefone: '(11) 98765-4321',
    email: 'maria.silva@email.com',
    motivo: 'Solicitação de segunda via de boleto e esclarecimento sobre cobrança indevida no mês de janeiro.'
  });

  const [tempValue, setTempValue] = useState('');

  const handleEdit = (field: keyof UserData) => {
    setEditingField(field);
    setTempValue(userData[field]);
  };

  const handleSave = (field: keyof UserData) => {
    setUserData(prev => ({ ...prev, [field]: tempValue }));
    setEditingField(null);
    toast.success('Dado atualizado com sucesso!');
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    
    // Simula geração do protocolo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const protocolo = `ATD${Date.now().toString().slice(-8)}`;
    
    setIsLoading(false);
    toast.success(`Protocolo gerado: ${protocolo}`, {
      description: 'Seu atendimento foi registrado com sucesso!'
    });
    
    // Em produção, navegaria para a tela de protocolo gerado
    navigate('/');
  };

  const DataField = ({ 
    field, 
    label, 
    icon: Icon, 
    multiline = false 
  }: { 
    field: keyof UserData; 
    label: string; 
    icon: React.ElementType;
    multiline?: boolean;
  }) => {
    const isEditing = editingField === field;

    return (
      <div className="group relative p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </Label>
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                {multiline ? (
                  <Textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="min-h-[80px] resize-none"
                    autoFocus
                  />
                ) : (
                  <Input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                  />
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(field)}
                    className="h-8"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="h-8"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`mt-1 text-foreground font-medium ${multiline ? 'text-sm leading-relaxed' : 'text-base'}`}>
                {userData[field]}
              </p>
            )}
          </div>

          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleEdit(field)}
            >
              <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Revise seus dados
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Verifique se todas as informações estão corretas antes de confirmar. 
            Você pode editar qualquer campo clicando no ícone de lápis.
          </p>
        </div>

        {/* Data Card */}
        <Card className="mb-6 shadow-violet-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Dados do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataField field="nome" label="Nome Completo" icon={User} />
            <DataField field="cpf" label="CPF / Documento" icon={CreditCard} />
            <DataField field="telefone" label="Telefone" icon={Phone} />
            <DataField field="email" label="E-mail" icon={Mail} />
            <DataField field="motivo" label="Motivo do Contato" icon={FileText} multiline />
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-medium text-foreground">Importante:</span> Ao confirmar, 
            seu atendimento será registrado e você receberá um número de protocolo 
            para acompanhamento.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar e Editar
          </Button>
          
          <Button
            className="flex-1 h-12 text-base font-semibold"
            onClick={handleConfirm}
            disabled={isLoading || editingField !== null}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando protocolo...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Confirmar e Gerar Protocolo
              </>
            )}
          </Button>
        </div>

        {/* Loading Overlay Message */}
        {isLoading && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Estamos registrando seu atendimento. Por favor, aguarde...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
