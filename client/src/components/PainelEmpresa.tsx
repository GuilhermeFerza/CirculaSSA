import { Vaga } from "../App";
import { Briefcase, Edit, MapPin, Trash2 } from 'lucide-react'

interface PainelEmpresaProps{
    vagas: Vaga[]
}

export default function PainelEmpresa({vagas}: PainelEmpresaProps){
    const minhaVagas = vagas;

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
                                <button className="btn-acao editar" onClick={()=>alert("Abre formulário de edição")}>
                                    <Edit size={16} /> Editar
                                </button>
                                <button className="btn-acao excluir" onClick={()=> alert("Chama rota DELETE do Go")}>
                                    <Trash2 size={16} />Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}