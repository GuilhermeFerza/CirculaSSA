import { User } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { fetchAuth } from '../utils/api'
import toast from 'react-hot-toast'

interface PerfilProps{
    perfilUsuario: string  
    setPerfilUsuario: (spu: string) => void
    setAbaAtiva: (saa: string) => void
}

export default function Perfil({perfilUsuario, setPerfilUsuario, setAbaAtiva}: PerfilProps){
  
  const [name, setName] = useState('');
  const [editarPerfil, setEditarPerfil] = useState(false);

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
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetchAuth(`${API_URL}/api/login`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      });

      if(response.ok){
        const dadosUser = await response.json();
        console.log("Dados recebidos do servidor: ", dadosUser)
        setPerfilUsuario(dadosUser.type)
        setName(dadosUser.name)
      }else{
        console.error("Erro na auth ou rota nao encontrada. Status: ", response.status)
      }
    }catch(error){
      console.error("Falha na comunicacao com a API: ", error)
    }
  };

  const editarVaga = ()=>{
    if (editarPerfil === true){
      setEditarPerfil(false);
    }else{
      setEditarPerfil(true);
    }
    
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const API_URL = import.meta.env.VITE_API_URL

    const dadosUser = {
      name: name,
    }

    const token = localStorage.getItem('token')
    if(!token){
      console.error("Nenhum token encontrado. User nao autenticado");
      return;
    }

    try{
      const response = await fetchAuth(`${API_URL}/api/users`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosUser)
      });

      if (response.ok){
        setEditarPerfil(false);
        toast.success("Perfil atualizado!")
      }else{
        console.error("Erro ao atualizar o perfil. Status:", response.status)
        toast.error("Erro ao atualizar o perfil.")
      }
    }catch(error){
      console.error("Falha na comunicação com a API: ", error)
      toast.error("Falha na comunicação com o servidor.")
    }

  }

  const ativarAlerta = ()=>{
    if ("geolocation" in navigator){
      toast.loading("Buscando sua localização...", { id: "geo-toast"})

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          toast.dismiss("geo-toast");

          const dadosParaSalvar = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            raio_alerta: 5,
            recebe_alerta: true
          };
          try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/users`, {
              method: 'PUT',
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(dadosParaSalvar)
            });
            if (response.ok){
              toast.success("Alertas de vagas ativados para sua região!");
            }else{
              toast.error("Erro ao salvar sua localização.");
            }
          }catch(error){
            toast.error("Erro ao comunicar com a API.")
          }
        },
        (error) => {
          console.error("Erro ao pegar localizacao", error);
          toast.error("Precisamos de permissão para ler sua localização e ativar os alertas!");
        }
      )
    }
  }


  useEffect(()=>{
    carregarDados();
  }, [])

  return(
        <>
          {!editarPerfil && (
            <div className="container-perfil">
            <h2>Meu Perfil</h2>
            <div className="card-info-perfil">
              <div className="avatar-placeholder">
                <User size={40} color="#94a3b8" />
              </div>
              <p>{name}</p>
              <p>Mode de Navegação atual</p>
              <span className='badge-perfil'>
                {perfilUsuario === 'candidato' ? 'buscando vagas' : 'empresa'}
              </span>
            </div>
            {perfilUsuario === 'candidato' && (
              <div style={{width: "100%"}}>
                <p className='pequeno-texto'>Quer ser avisado de vagas perto de você?</p>
                <button onClick={ativarAlerta} className='btn-loc'>
                    Ativar Alertas (5km)
                </button>
              </div>
            )}
            <button className='btn-edit' onClick={editarVaga}>
              Editar Perfil
            </button>
            <button className='btn-sair' onClick={sairDoPerfil}>
              Sair / Trocar de Perfil
            </button>
            
          </div>
          )}
          
          {editarPerfil && (
            <div className="container-perfil">
              <h2>Meu Perfil</h2>

              <form className='form-vaga' onSubmit={handleSubmit}>
                <div className='grupo-input'>
                  <label>Editar seu nome</label>
                  <input type="text" placeholder={`${name}`} value={name} onChange={(e) => setName(e.target.value)} required/>
                </div>
                <button type='submit' className='btn-salvar'>
                  Salvar
                </button>
                <button className='btn-edit' onClick={editarVaga}>
                  Sair da Edição
                </button>
              </form>
              

            </div>
          )}

        </>
    )
}
    