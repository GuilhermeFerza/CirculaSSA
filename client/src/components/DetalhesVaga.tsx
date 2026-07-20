import {} from 'lucide-react'
import { Vaga } from '../App'
import toast from 'react-hot-toast';
import { fetchAuth } from '../utils/api';

interface DetalhesVagaProps{
    setVagaSelecionada : (vaga: Vaga | null) => void;
    vagaSelecionada: Vaga;
    onFiltrarEmpresa: (empresa: string) => void;
}

const favoritarVaga = async (id: number) => {
    const token = localStorage.getItem('token');

    if(!token){
      toast.error('Você precisa estar logado para salvar vagas!');
      return;
    }

    try{
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetchAuth(`${API_URL}/api/salvas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vaga_id: id})
      });

      if(response.status === 201){
        toast.success("Vaga salva com sucesso!")
      }else if(response.status === 409){
        toast.error("Você já salvou está vaga antes!");
      }else{
        toast.error('Erro ao salvar a vaga.');
      }
    }catch(error){
      console.error("Erro ao favoritar:", error);
      toast.error('Falha de conexão com o servidor');
    }

  }

export default function DetalhesVaga({setVagaSelecionada, vagaSelecionada, onFiltrarEmpresa}: DetalhesVagaProps){
  const handleCandidatar = () => {
    const contato = vagaSelecionada.link_contato;
    if(!contato){
      toast.error("Nenhum contato disponibilizado pela empresa.")
      return
    }

    const apenasNumeros = contato.replace(/\D/g, '')

    if (apenasNumeros.length >= 10){
      const mensagem = encodeURIComponent(`Olá! Vi a vaga de "${vagaSelecionada.titulo}" no CirculaSSA e gostaria de me candidatar.`);
      window.open(`https://wa.me/55${apenasNumeros}?text=${mensagem}`, '_blank')
    } else if(contato.includes('@')){
      window.open(`mailto:${contato}?subject=Candidatura: ${vagaSelecionada.titulo}`, '_blank')
    }else{
      const urlFormatada = contato.startsWith('http') ? contato : `https://${contato}`;
      window.open(urlFormatada, '_blank');
    }

  }  
  
  return(
       <>
          <div className="overlay" onClick={() => setVagaSelecionada(null)}></div>
          <div className="bottom-sheet">
            <button className="botao-fechar" onClick={() => setVagaSelecionada(null)}>&times;</button>
            
            <h2 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {vagaSelecionada.titulo}
              {vagaSelecionada.parceria && (
                <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                  🎓 Parceria Acadêmica
                </span>
              )}
            </h2>
            
            <span className="tag-tipo">{vagaSelecionada.tipo}</span>
            
            <p className="info-empresa">
              <strong>Empresa:</strong>{' '}
              <button 
                onClick={() => onFiltrarEmpresa(vagaSelecionada.empresa)}
                style={{ background: 'none', border: 'none', color: '#0ea5e9', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontFamily: 'inherit' }}
              >
                {vagaSelecionada.empresa}
              </button>{' '}
              &bull; <strong>Local:</strong> {vagaSelecionada.bairro}
            </p>

            <p className="descricao-vaga">{vagaSelecionada.descricao}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className='btn-submit'
                style={{ flex: 1, backgroundColor: '#10b981', border: 'none' }}
                onClick={handleCandidatar}
              >
                Candidatar-se
              </button>
              <button
                className='btn-submit'
                style={{ flex: 1, backgroundColor: '#3b82f6', border: 'none' }}
                onClick={()=> favoritarVaga(vagaSelecionada.id)}
              >
                Salvar Vaga
              </button>
            </div>

          </div>
        </>

    )
}