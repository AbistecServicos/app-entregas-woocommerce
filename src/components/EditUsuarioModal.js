// components/EditUsuarioModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ==============================================================================
// MODAL DE EDIÇÃO DE DADOS PESSOAIS DO USUÁRIO
// ==============================================================================
/**
 * Componente de modal para edição de dados pessoais, incluindo upload de foto.
 * Suporta normalização de nomes de arquivos e integração com Supabase Storage.
 * Aprimoramentos: Validação, acessibilidade e feedback visual.
 */
export default function EditUsuarioModal({ isOpen, onClose, userProfile }) {
  // ============================================================================
  // 1. DEFINIÇÃO DE ESTADOS
  // ============================================================================
  /**
   * Gerencia carregamento, dados do formulário, arquivo selecionado e erros.
   * Adicionado estado para validação de formulário.
   */
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_usuario: '',
    telefone: '',
    foto: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [formValid, setFormValid] = useState(false); // Novo estado para validação
  const [showRemovePhoto, setShowRemovePhoto] = useState(false); // ADICIONE ESTA LINHA

// ============================================================================
// 2. CARREGAR DADOS ATUAIS AO ABRIR MODAL
// ============================================================================
/**
 * Carrega os dados do perfil do usuário ao abrir o modal e valida o formulário.
 * Executa apenas se o modal estiver aberto e userProfile existir.
 */
useEffect(() => {
  if (isOpen && userProfile) {
    const newFormData = {
      nome_completo: userProfile.nome_completo || '',
      nome_usuario: userProfile.nome_usuario || '',
      telefone: userProfile.telefone || '',
      foto: userProfile.foto || ''
    };
    
    setFormData(newFormData);
    validateForm(newFormData); // Valida com os dados carregados
  }
}, [isOpen, userProfile]);

// ============================================================================
// 3. FUNÇÃO: VALIDAR FORMULÁRIO
// ============================================================================
/**
 * Valida campos obrigatórios (nome_completo e telefone) e atualiza estado de validade.
 * Requisitos: Nome completo e telefone não podem ser vazios.
 */
const validateForm = (data = formData) => {
  const isValid = data.nome_completo.trim() !== '' && data.telefone.trim() !== '';
  setFormValid(isValid);
};

// ============================================================================
// 4. FUNÇÃO: ATUALIZAR CAMPOS DO FORMULÁRIO
// ============================================================================
/**
 * Atualiza o estado do formulário com base nos inputs e revalida.
 * @param {Object} e - Evento de mudança do input.
 */
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => {
    const newData = { ...prev, [name]: value };
    validateForm(newData); // Revalida após mudança
    return newData;
  });
};

  // ============================================================================
  // 5. FUNÇÃO: NORMALIZAR NOME DO ARQUIVO
  // ============================================================================
  /**
   * Remove acentos e caracteres especiais do nome do arquivo para compatibilidade.
   * @param {string} fileName - Nome original do arquivo.
   * @returns {string} Nome normalizado.
   */
  const normalizeFileName = (fileName) => {
    return fileName
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Substitui especiais por underscore
  };

  // ============================================================================
  // 6. FUNÇÃO: ATUALIZAR ARQUIVO DE FOTO
  // ============================================================================
  /**
   * Valida e armazena o arquivo de imagem selecionado, com limite de tamanho (5MB).
   * @param {Object} e - Evento de mudança do input de arquivo.
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Limite de 5MB
        setError('O arquivo excede o limite de 5MB.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(''); // Limpa erro se válido
    }
  };




// ============================================================================
// 7 FUNÇÃO: SALVAR ALTERAÇÕES
// ============================================================================
/**
 * Salva os dados atualizados no Supabase, incluindo upload de foto se houver.
 * Gerencia a remoção de fotos antigas para evitar acúmulo no storage.
 * Inclui tratamento robusto de erros e feedback ao usuário.
 */
const handleSave = async () => {
  if (!formValid) {
    setError('Preencha o nome completo e o telefone.');
    return;
  }

  try {
    setLoading(true);
    setError('');

    let photoUrl = formData.foto;
    let oldFileFullPath = null;

    // Identifica foto antiga para possível exclusão
    if (formData.foto) {
      const url = new URL(formData.foto);
      const pathParts = url.pathname.split('/');
      oldFileFullPath = pathParts.slice(4).join('/');
    }

    if (selectedFile) {
      const baseName = normalizeFileName(selectedFile.name);
      const fileName = `${userProfile.uid}-${Date.now()}-${baseName}`;
      const fullPath = `fotos/${fileName}`; // Caminho completo
      
      // Faz upload da nova foto
      const { error: uploadError } = await supabase.storage
        .from('box')
        .upload(fullPath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtém URL pública da nova foto
      const { data: urlData } = supabase.storage
        .from('box')
        .getPublicUrl(fullPath);
      photoUrl = urlData.publicUrl;
    }

    // Atualiza dados do usuário no banco
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        nome_completo: formData.nome_completo,
        nome_usuario: formData.nome_usuario,
        telefone: formData.telefone,
        foto: photoUrl
      })
      .eq('uid', userProfile.uid);

    if (updateError) throw updateError;

    // Remove foto antiga APÓS sucesso na atualização
    if (oldFileFullPath && selectedFile) {
      try {
        await supabase.storage
          .from('box')
          .remove([oldFileFullPath]);
      } catch (deleteError) {
        console.warn('Aviso: Foto antiga não pôde ser removida:', deleteError);
      }
    }

    alert('Dados pessoais atualizados com sucesso!');
    onClose();
    window.location.reload();

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    setError(error.message || 'Erro ao atualizar dados. Tente novamente.');
  } finally {
    setLoading(false);
  }
};

// ============================================================================
// 8. FUNÇÃO: REMOVER FOTO
// ============================================================================
/**
 * Remove a foto atual do perfil tanto do estado local quanto do storage.
 * Inclui confirmação do usuário para evitar remoções acidentais.
 */
const handleRemovePhoto = async () => {
  if (!formData.foto) return;
  
  try {
    // Extrai o caminho completo do arquivo da URL
    // A URL é algo como: https://xxx.supabase.co/storage/v1/object/public/box/fotos/nome-arquivo.jpg
    const url = new URL(formData.foto);
    const pathParts = url.pathname.split('/');
    
    // O caminho completo é: 'box/fotos/nome-arquivo.jpg'
    // Precisamos remover '/storage/v1/object/public/' do início
    const fullPath = pathParts.slice(4).join('/');
    
    // Remove do storage do Supabase usando o caminho completo
    const { error: removeError } = await supabase.storage
      .from('box') // Nome do bucket
      .remove([fullPath]);
    
    if (removeError) throw removeError;
    
    // Atualiza estado local
    setFormData(prev => ({ ...prev, foto: '' }));
    setShowRemovePhoto(false);
    setSelectedFile(null); // Limpa qualquer arquivo selecionado
    setError('');
    
    alert('Foto removida com sucesso!');
    
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    setError('Erro ao remover foto. Tente novamente.');
  }
};

// ============================================================================
// 9. RENDERIZAÇÃO DO COMPONENTE
// ============================================================================
/**
 * Renderiza o modal de edição com formulário completo.
 * Inclui seção de foto com opção de remoção e confirmação.
 * Implementa acessibilidade e feedback visual adequados.
 */
if (!isOpen) return null;

return (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    role="dialog"
    aria-labelledby="edit-user-modal-title"
    aria-modal="true"
  >
    <div className="bg-white p-6 rounded-lg w-96 max-w-95vw">
      <h2
        id="edit-user-modal-title"
        className="text-xl font-bold text-gray-800 mb-4"
      >
        ✏️ Editar Dados Pessoais
      </h2>
      
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 p-2 mb-4 rounded"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Campo Nome Completo */}
        <div>
          <label
            htmlFor="nome-completo-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome Completo *
          </label>
          <input
            id="nome-completo-input"
            type="text"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={loading}
            aria-required="true"
          />
        </div>

        {/* Campo Nome de Usuário */}
        <div>
          <label
            htmlFor="nome-usuario-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nome de Usuário
          </label>
          <input
            id="nome-usuario-input"
            type="text"
            name="nome_usuario"
            value={formData.nome_usuario}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Campo Telefone */}
        <div>
          <label
            htmlFor="telefone-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Telefone *
          </label>
          <input
            id="telefone-input"
            type="tel"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={loading}
            aria-required="true"
          />
        </div>

        {/* Seção de Foto de Perfil */}
        <div>
          <label
            htmlFor="foto-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Foto de Perfil
          </label>
          
          {/* Preview da foto atual com botão de remoção */}
          {formData.foto && (
            <div className="relative inline-block mb-3">
              <img
                src={formData.foto}
                alt="Foto atual do perfil"
                className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => setShowRemovePhoto(true)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-md"
                disabled={loading}
                aria-label="Remover foto de perfil"
                title="Remover foto"
              >
                ×
              </button>
            </div>
          )}

          {/* Input para selecionar nova foto */}
          <input
            id="foto-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
            aria-label="Selecionar nova foto de perfil"
          />
          <p className="text-xs text-gray-500 mt-2">
            Escolha uma imagem (máx. 5MB). Formatos: JPG, PNG, GIF.
          </p>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
          disabled={loading}
          aria-label="Cancelar edição"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !formValid}
          className="flex-1 bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Salvar alterações"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          ) : (
            'Salvar Alterações'
          )}
        </button>
      </div>
    </div>

    {/* Modal de Confirmação para Remover Foto */}
    {showRemovePhoto && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
        <div className="bg-white p-6 rounded-lg w-80 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Remover Foto</h3>
          <p className="text-gray-600 mb-5">
            Tem certeza que deseja remover sua foto de perfil?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRemovePhoto(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
            >
              Manter Foto
            </button>
            <button
              onClick={handleRemovePhoto}
              className="flex-1 bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}