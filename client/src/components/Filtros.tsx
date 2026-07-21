import { useEffect, useState } from 'react'
import '../App.css'
import { Filter, Bell } from 'lucide-react'
import { fetchAuth } from '../utils/api'
import toast from 'react-hot-toast'

interface FiltrosProps{
    mostrarFiltros: boolean
    filtrosAtivos: string[]
    alternarFiltro: (tipo: string) => void
    bairrosDisponiveis: string[]
    mostrarBairro: string
    setMostrarBairro: (smb: string) => void
    setMostrarFiltros: (smf: boolean) => void
    termoBusca: string
    setTermoBusca: (stb: string) => void
}

export default function Filtros({mostrarFiltros, filtrosAtivos, alternarFiltro, bairrosDisponiveis, mostrarBairro, setMostrarBairro, setMostrarFiltros, termoBusca, setTermoBusca}:FiltrosProps){

    const [notificacoes, setNotificacoes] = useState<any[]>([])
    const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)
    
    useEffect(()=>{
        const carregarNotificacoes = async ()=>{
            const token = localStorage.getItem('token');
            if(!token)return;

            const API_URL = import.meta.env.VITE_API_URL
            try{
                const response = await fetchAuth(`${API_URL}/api/notificacoes`, {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json'}
                });
                if (response.ok){
                    const dados = await response.json();
                    setNotificacoes(dados)
                }
            }catch(erro){
                console.error("Erro ao puxar notificações", erro);
                toast.error("Erro ao puxar notificações")
            }
        };
       carregarNotificacoes(); 
    },[]);
    
    const toggleFiltros = () => {
        setMostrarFiltros(!mostrarFiltros);
        if (mostrarNotificacoes) setMostrarNotificacoes(false);
    }

    const toggleNotificacoes = () => {
        setMostrarNotificacoes(!mostrarNotificacoes);
        if (mostrarFiltros) setMostrarFiltros(false);
    }

    return (
        <>
            <div className="container-acoes-topo">
                <button 
                    className={`btn-acao-topo ${mostrarNotificacoes ? 'ativo' : ''}`}
                    onClick={toggleNotificacoes}
                >
                    <Bell size={20} />
                    {notificacoes.length > 0 && (
                        <span className="badge-notificacao">{notificacoes.length}</span>
                    )}
                </button>

                <div className="divisor-acoes"></div>

                <button 
                    className={`btn-acao-topo ${mostrarFiltros ? 'ativo' : ''}`}
                    onClick={toggleFiltros}
                >
                    <Filter size={20} />
                </button>
            </div>
            
            {mostrarFiltros && (
                <div className="painel-filtros">
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="text" 
                            placeholder="Buscar vaga por título..." 
                            value={termoBusca}
                            onChange={(e) => setTermoBusca(e.target.value)}
                            className="select-bairro"
                            style={{ backgroundImage: 'none', paddingRight: '16px' }} 
                        />
                    </div>
                    <h3>Mostrar oportunidades do tipo</h3>
                    <div className="chips-container">
                        {['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão'].map(tipo => (
                            <button
                                key={tipo}
                                className={`chip-filtro ${filtrosAtivos.includes(tipo) ? 'ativo' : ''}`}
                                onClick={() => alternarFiltro(tipo)}
                            >
                                {tipo}
                            </button>
                        ))}
                    </div>
                    {bairrosDisponiveis.length > 0 && (
                        <div style={{ marginTop: '20px'}}>
                            <h3>Filtrar por Bairro</h3>
                            <select
                                className="select-bairro"
                                value={mostrarBairro}
                                onChange={(e) => setMostrarBairro(e.target.value)}
                            >
                                <option value=''>Todos os Bairros</option>
                                {bairrosDisponiveis.map(bairro => (
                                    <option key={bairro} value={bairro}>
                                        {bairro}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {mostrarNotificacoes && (
                <div className="painel-filtros painel-notificacoes">
                    <h3>Suas Notificações</h3>
                    <div className="lista-notificacoes">
                        {notificacoes.length === 0 ? (
                            <p className="texto-vazio-notif">Nenhuma vaga nova no seu radar por enquanto.</p>
                        ) : (
                            notificacoes.map((notif) => (
                                <div key={notif.id} className="item-notificacao">
                                    <p>{notif.mensagem}</p>
                                    <small>{new Date(notif.criado_em).toLocaleDateString()}</small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    )
}