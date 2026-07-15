import { User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchAuth } from '../utils/api'

interface PerfilProps{
    perfilUsuario: string  
    setPerfilUsuario: (spu: string) => void
    setAbaAtiva: (saa: string) => void
}

export default function Perfil({perfilUsuario, setPerfilUsuario, setAbaAtiva}: PerfilProps){
  
  const [nome, setNome] = useState()  

  const sairDoPerfil = () => {
    localStorage.removeItem('perfilUsuario');
    localStorage.removeItem('token');
    setPerfilUsuario('');
    setAbaAtiva('on-board');
  }


  const carregarDados = async ()=>{
    const token = localStorage.getItem('token')
    if(!token){
      console.error("Nenhum token encontrado. User nao autenticado");
      return;
    }
    try{
      const response = await fetchAuth("http://localhost:8080/api/login", {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      });

      if(response.ok){
        const dadosUser = await response.json();
        console.log("Dados recebidos do servidor: ", dadosUser)
        setNome(dadosUser.name)
      }else{
        console.error("Erro na auth ou rota nao encontrada. Status: ", response.status)
      }
    }catch(error){
      console.error("Falha na comunicacao com a API: ", error)
    }
  };

  useEffect(()=>{
    carregarDados();
  }, [])

  return(
        <div className="container-perfil">
          <h2>Meu Perfil</h2>
          <div className="card-info-perfil">
            <div className="avatar-placeholder">
              <User size={40} color="#94a3b8" />
            </div>
            <p>{nome}</p>
            <p>Mode de Navegação atual</p>
            <span className='badge-perfil'>
              {perfilUsuario === 'candidato' ? 'buscando vagas' : 'empresa'}
            </span>
          </div>
          <button className='btn-sair' onClick={sairDoPerfil}>
            Sair / Trocar de Perfil
          </button>
        </div>

    )
}
    