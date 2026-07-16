import { Vaga } from "../App";
import { Briefcase, Edit, MapPin, Trash2 } from 'lucide-react'
import FormularioEdicao from "./FormularioEdicao";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchAuth } from "../utils/api";

export default function PainelEmpresa(){

    const [vagaEmEdicao, setVagaEmEdicao]=useState<Vaga | null>(null)
    const [minhasVagas, setMinhasVagas]=useState<Vaga[]>([])

    const carregarDados = async ()=>{
        const token = localStorage.getItem('token')

        if(!token){
            console.error("Nenhum token encontrado. User nao autenticado");
            return;
        }

        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/vaga/minhas`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            if(response.ok){
                const dadosVagas = await response.json();
                console.log("Dados recebidos do servidor: ", dadosVagas)
                setMinhasVagas(dadosVagas);
            }else{
                console.error("Erro na auth ou rota nao encontrada. Status: ", response.status)
            }
        }catch(error){
            console.error("Falha na comunicacao com a API: ", error)
        }
    };

    useEffect(()=>{
        carregarDados();
    },[])



    const excluirVaga = async (id: number) => {
        const confirmacao = window.confirm("Confirma a exclusão desta vaga?");
        if(!confirmacao) return;

        const token = localStorage.getItem('token')

        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/vaga/${id}`,{
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if(response.ok){
                setMinhasVagas(estadoAtual => estadoAtual.filter(vaga => vaga.id !== id));
            }else{
                toast.error("Falha ao excluir vaga no servidor. Você está autorizado?")
            }
        }catch(error){
            console.error("Erro na req DELETE:", error)
            toast.error("Erro de conexão com o servidor")
        }
    }

    const atualizarVagaNaLista = (vagaAtualizada: Vaga) => {
        setMinhasVagas(estadoAtual => estadoAtual.map(vaga =>
            vaga.id === vagaAtualizada.id ? vagaAtualizada : vaga
        ));
    }





    return(
        <div className="container-formulario">
            <h2>Minhas Vagas Anunciadas</h2>
            <p className="subtitulo">Gerencie as oportunidades da sua empresa</p>
            <div className="lista-vagas">
                {minhasVagas.length === 0 ?(
                    <div className="estado-vazio">
                        <Briefcase size={48} color="#cbd5e1" />
                        <p>Nenhuma vaga encontrada no sistema.</p>
                    </div>
                ) : (
                    minhasVagas.map((vaga) => (
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