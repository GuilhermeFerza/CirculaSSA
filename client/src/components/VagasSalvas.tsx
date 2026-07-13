import { useEffect, useState } from "react"
import { Vaga } from "../App"
import { Bookmark, MapPin, Trash2 } from 'lucide-react'

interface VagaSalvasProps{
    vagas: Vaga[]
}

export default function VagasSalvas({vagas}:VagaSalvasProps){
    const [idsSalvos, setIdsSalvos] = useState<number[]>([]);

    useEffect(()=>{
        const salvos = JSON.parse(localStorage.getItem('vagasSalvas') || '[]');
        setIdsSalvos(salvos);
    },[]);
    
    const removerVaga = (id: number) =>{
        const novaLista = idsSalvos.filter(vagaId => vagaId !== id);
        setIdsSalvos(novaLista);
        localStorage.setItem('vagasSalvas', JSON.stringify(novaLista))
    };

    const vagasFavoritas = vagas.filter(vaga => idsSalvos.includes(vaga.id));

    return(
        <div className="container-formulario">
            <h2>Vagas Salvas</h2>
            <p className="subtitulo">Oportunidades que você marcou para ver depois</p>
            <div className="lista-vagas">
                {vagasFavoritas.length === 0 ? (
                    <div className="estado-vazio">
                        <Bookmark size={48} color="#cbd5e1"/>
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
                                <strong>Empresa:</strong> {vaga.empresa}
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