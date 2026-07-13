import { User } from 'lucide-react'


interface PerfilProps{
    perfilUsuario: string
    sairDoPerfil: () => void    
}

export default function Perfil({perfilUsuario, sairDoPerfil}: PerfilProps){
    return(
        <div className="container-perfil">
          <h2>Meu Perfil</h2>
          <div className="card-info-perfil">
            <div className="avatar-placeholder">
              <User size={40} color="#94a3b8" />
            </div>
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
    