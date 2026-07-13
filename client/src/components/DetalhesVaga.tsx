import {} from 'lucide-react'
import { Vaga } from '../App'


interface DetalhesVagaProps{
    setVagaSelecionada : (vaga: Vaga | null) => void;
    vagaSelecionada: Vaga;
}

const favoritarVaga = (id: number) => {
    const salvos = JSON.parse(localStorage.getItem('vagasSalvas') || '[]')
    if(!salvos.includes(id)){
      salvos.push(id);
      localStorage.setItem('vagasSalvas', JSON.stringify(salvos));
      alert('Vaga salva com sucesso nas suas listas!');
    }else{
      alert('Você já salvou esta vaga antes!')
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