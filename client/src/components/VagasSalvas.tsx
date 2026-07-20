import { useEffect, useState } from "react"
import { Vaga } from "../App"
import { Bookmark, MapPin, Trash2 } from 'lucide-react'
import { fetchAuth } from "../utils/api";

export default function VagasSalvas(){
    const [vagasFavoritas, setVagasFavoritas] = useState<Vaga[]>([])
    const [idsSalvos, setIdsSalvos] = useState<number[]>([]);

    const buscarVagasSalvas = async ()=>{
        const token = localStorage.getItem('token')
        if(!token) return;
    
        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/salvas`,{
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok){
                const dados = await response.json();
                setVagasFavoritas(dados);
            }
        }catch(error){
            console.error("Erro ao carregar vagas salvas: ", error);
        }
    }

    useEffect(()=>{
        buscarVagasSalvas();        
    },[]);
    
    const removerVaga = async (id: number) =>{
        const token = localStorage.getItem('token');
        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/salvas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok){
                setVagasFavoritas(estadoAtual => estadoAtual.filter(vaga => vaga.id !== id));
            }
        }catch(error){
            console.error("Erro ao remover", error)
        }
    };

    return(
        <div className="container-formulario">
            <h2>Vagas Salvas</h2>
            <p className="subtitulo">Oportunidades que você marcou para ver depois</p>
            <div className="lista-vagas">
                {vagasFavoritas.length === 0 ? (
                    <div className="estado-vazio">
                        <Bookmark size={48} color="#cbd5e1"/>
                        <p>Você ainda não salvou nenhuma vaga.</p>
                    </div>
                ) : (
                    vagasFavoritas.map((vaga) => (
                        <div key={vaga.id} className="card-vaga-empresa">
                            <div className="cabecalho-card">
                                <h3>{vaga.titulo}</h3>
                                <span className="tag-tipo">{vaga.tipo}</span>
                            </div>
                            <p className="local-vaga">
                                <MapPin size={16}/>{vaga.bairro}
                            </p>
                            <p className="info-empresa" style={{marginBottom: '0', marginTop: '8px'}}>
                                <strong >Empresa:</strong> {vaga.empresa}<br></br>
                                <strong>Contato:</strong>{vaga.link_contato}
                            </p>
                            <div className="acoes-card">
                                <button
                                    className="btn-acao excluir"
                                    onClick={()=> removerVaga(vaga.id)}
                                >   
                                    <Trash2 size={16} /> Remover
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div> 
        </div>

    )


}