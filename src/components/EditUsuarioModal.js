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

  // ============================================================================
  // 2. CARREGAR DADOS ATUAIS AO ABRIR MODAL
  // ============================================================================
  /**
   * Carrega os dados do perfil do usuário ao abrir o modal e valida o formulário.
   * Executa apenas se o modal estiver aberto e userProfile existir.
   */
  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nome_completo: userProfile.nome_completo || '',
        nome_usuario: userProfile.nome_usuario || '',
        telefone: userProfile.telefone || '',
        foto: userProfile.foto || ''
      });
      validateForm(); // Valida após carregar dados
    }
  }, [isOpen, userProfile]);

  // ============================================================================
  // 3. FUNÇÃO: VALIDAR FORMULÁRIO
  // ============================================================================
  /**
   * Valida campos obrigatórios (nome_completo e telefone) e atualiza estado de validade.
   * Requisitos: Nome completo e telefone não podem ser vazios.
   */
  const validateForm = () => {
    const isValid = formData.nome_completo.trim() !== '' && formData.telefone.trim() !== '';
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
  // 7. FUNÇÃO: SALVAR ALTERAÇÕES
  // ============================================================================
  /**
   * Salva os dados atualizados no Supabase, incluindo upload de foto se houver.
   * Inclui tratamento de erros e feedback ao usuário.
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

      if (selectedFile) {
        const baseName = normalizeFileName(selectedFile.name);
        const fileName = `${userProfile.uid}-${Date.now()}-${baseName}`;
        const { error: uploadError } = await supabase.storage
          .from('box/fotos')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('box/fotos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome_completo: formData.nome_completo,
          nome_usuario: formData.nome_usuario,
          telefone: formData.telefone,
          foto: photoUrl
        })
        .eq('uid', userProfile.uid);

      if (error) throw error;

      alert('Dados pessoais atualizados com sucesso!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setError('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 8. RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================
  /**
   * Renderiza o modal apenas se estiver aberto, com formulário e botões de ação.
   * Inclui feedback visual e acessibilidade.
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
            className="bg-red-50 border border-red-200 text-red-600 p-2 mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label
              htmlFor="nome-completo-input"
              className="block text-sm font-medium text-gray-700"
            >
              Nome Completo
            </label>
            <input
              id="nome-completo-input"
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="nome-usuario-input"
              className="block text-sm font-medium text-gray-700"
            >
              Nome de Usuário
            </label>
            <input
              id="nome-usuario-input"
              type="text"
              name="nome_usuario"
              value={formData.nome_usuario}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="telefone-input"
              className="block text-sm font-medium text-gray-700"
            >
              Telefone
            </label>
            <input
              id="telefone-input"
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              required
              disabled={loading}
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="foto-input"
              className="block text-sm font-medium text-gray-700"
            >
              Foto de Perfil
            </label>
            {formData.foto && (
              <img
                src={formData.foto}
                alt="Foto atual do perfil"
                className="mt-2 h-20 w-20 object-cover rounded-full mb-2"
              />
            )}
            <input
              id="foto-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
              disabled={loading}
              aria-label="Selecionar foto de perfil"
            />
            <p className="text-xs text-gray-500 mt-1">Escolha uma imagem ou tire uma foto com a câmera (máx. 5MB).</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
            disabled={loading}
            aria-label="Cancelar edição"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formValid}
            className="flex-1 bg-purple-600 text-white py-2 rounded disabled:opacity-50"
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
              'Salvar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}