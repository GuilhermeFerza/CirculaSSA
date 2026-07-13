import { Vaga } from "../App";
import { Briefcase, Edit, MapPin, Trash2 } from 'lucide-react'
import FormularioEdicao from "./FormularioEdicao";
import { useState } from "react";


interface PainelEmpresaProps{
    vagas: Vaga[]
    setVagas: React.Dispatch<React.SetStateAction<Vaga[]>>;
}

export default function PainelEmpresa({vagas, setVagas}: PainelEmpresaProps){

    const [vagaEmEdicao, setVagaEmEdicao]=useState<Vaga | null>(null)
    const minhaVagas = vagas;


    const excluirVaga = async (id: number) => {
        const confirmacao = window.confirm("Confirma a exclusão desta vaga?");
        if(!confirmacao) return;

        try{
            const response = await fetch(`http://localhost:8080/api/vaga/${id}`,{
                method: 'DELETE'
            });
            if(response.ok){
                setVagas(vagas.filter(vaga => vaga.id !== id));
            }else{
                alert("Falha ao excluir vaga no servidor.")
            }
        }catch(error){
            console.error("Erro na req DELETE:", error)
            alert("Erro de conexão com o servidor")
        }
    }

    const atualizarVagaNaLista = (vagaAtualizada: Vaga) => {
        setVagas(estadoAtual => estadoAtual.map(vaga =>
            vaga.id === vagaAtualizada.id ? vagaAtualizada : vaga
        ));
    }





    return(
        <div className="container-formulario">
            <h2>Minhas Vagas Anunciadas</h2>
            <p className="subtitulo">Gerencie as oportunidades da sua empresa</p>
            <div className="lista-vagas">
                {minhaVagas.length === 0 ?(
                    <div className="estado-vazio">
                        <Briefcase size={48} color="#cbd5e1" />
                        <p>Nenhuma vaga encontrada no sistema.</p>
                    </div>
                ) : (
                    minhaVagas.map((vaga) => (
                        <div key={vaga.id} className="card-vaga-empresa">
                            <div className="cabecalho-card">
                                <h3>{vaga.titulo}</h3>
                                <span className="tag-tipo">{vaga.tipo}</span>
                            </div>
                            <p className="local-vaga">
                                <MapPin size={16} />{vaga.bairro}
                            </p>
                            <div className="acoes-card">
                                <button className="btn-acao editar" onClick={()=> setVagaEmEdicao(vaga)}>
                                    <Edit size={16} /> Editar
                                </button>
                                <button className="btn-acao excluir" onClick={()=> excluirVaga(vaga.id)}>
                                    <Trash2 size={16} />Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {vagaEmEdicao && (
                <FormularioEdicao 
                    vagaParaEditar={vagaEmEdicao} 
                    fecharEdicao={() => setVagaEmEdicao(null)}
                    atualizarLista={atualizarVagaNaLista}
                />
            )}
        </div>
    );
}