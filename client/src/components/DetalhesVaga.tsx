import {} from 'lucide-react'
import { Vaga } from '../App'
import toast from 'react-hot-toast';

interface DetalhesVagaProps{
    setVagaSelecionada : (vaga: Vaga | null) => void;
    vagaSelecionada: Vaga;
}

const favoritarVaga = async (id: number) => {
    const token = localStorage.getItem('token');

    if(!token){
      toast.error('Você precisa estar logado para salvar vagas!');
      return;
    }

    try{
      const response = await fetch('http://localhost:8080/api/salvas', {
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

export default function DetalhesVaga({setVagaSelecionada, vagaSelecionada}: DetalhesVagaProps){
    return(
        <>
          <div className="overlay" onClick={() => setVagaSelecionada(null)}></div>
          <div className="bottom-sheet">
            <button className="botao-fechar" onClick={() => setVagaSelecionada(null)}>&times;</button>
            <h2>{vagaSelecionada.titulo}</h2>
            <span className="tag-tipo">{vagaSelecionada.tipo}</span>
            <p className="info-empresa">
              <strong>Empresa:</strong> {vagaSelecionada.empresa} &bull; <strong>Local:</strong> {vagaSelecionada.bairro}
            </p>
            <p className="descricao-vaga">{vagaSelecionada.descricao}</p>
            <button
              className='btn-submit'
              style={{width: '100%', marginTop: '20px'}}
              onClick={()=> favoritarVaga(vagaSelecionada.id)}
            >
              Salvar Vaga
            </button>
          </div>
        </>

    )
}