import { LogIn, MapPin, Save, X } from 'lucide-react'
import { Vaga } from '../App';
import { useState } from 'react';


interface FormularioEdicaoProps{
    vagaParaEditar: Vaga;
    fecharEdicao: () => void;
    atualizarLista: (vagaAtualizada: Vaga) => void
}

export default function FormularioEdicao({ vagaParaEditar, fecharEdicao, atualizarLista }: FormularioEdicaoProps){
    const [titulo, setTitulo] = useState(vagaParaEditar.titulo);
    const [empresa, setEmpresa] = useState(vagaParaEditar.empresa);
    const [descricao, setDescricao] = useState(vagaParaEditar.descricao);
    const [tipo, setTipo] = useState(vagaParaEditar.tipo);
    const [bairro, setBairro] = useState(vagaParaEditar.bairro);
    const [localizacao, setLocalizacao] = useState({lat: vagaParaEditar.latitude, lon: vagaParaEditar.longitude});
    const [buscandoGps, setBuscandoGps] =useState(false);

    const capturarLocalizacao = (e: React.MouseEvent) => {
        e.preventDefault();
        setBuscandoGps(true);

        if ("geolocation" in navigator){
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    setLocalizacao({
                        lat: posicao.coords.latitude,
                        lon: posicao.coords.longitude
                    });
                    setBuscandoGps(false);
                },
                (erro) => {
                    console.error("Erro no GPS:", erro);
                    alert("Acesso negado à localização.")
                    setBuscandoGps(false)
                }
            );
        }else{
            alert("Navegador incompatível com GPS.");
            setBuscandoGps(false)
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        const dadosVaga = {
            id: vagaParaEditar.id,
            titulo,
            empresa,
            descricao,
            tipo,
            bairro,
            latitude: localizacao.lat,
            longitude: localizacao.lon
        };

        try{
            const response = await fetch(`http://localhost:8080/api/vaga/${vagaParaEditar.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosVaga)
            });

            if (response.ok){
                atualizarLista(dadosVaga)
                fecharEdicao();
            }else{
                alert("Falha na atualização do servidor.")
            }
        }catch(error){
            console.error("Erro na req PUT:", error);
            alert("Falha de conexão com o servidor.");
        }
    };

    return(
        <>
            <div className="overlay" onClick={fecharEdicao}></div>
            <div className="bottom-sheet" style={{ height: '85vh', overflowY: 'auto' }}>
                <button className="botao-fechar" onClick={fecharEdicao}><X size={20} /></button>
                <h2>Editar Vaga</h2>
                <form onSubmit={handleUpdate} className="form-vaga" style={{ marginTop: '20px' }}>
                    <div className="grupo-input">
                        <label>Título da Vaga</label>
                        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                    </div>
                    <div className="grupo-input">
                        <label>Nome da Empresa</label>
                        <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
                    </div>
                    <div className="grupo-input">
                        <label>Tipo de Contrato</label>
                        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="CLT">CLT</option>
                            <option value="Estágio">Estágio</option>
                            <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                            <option value="Mutirão">Mutirão</option>
                        </select>
                    </div>
                    <div className="grupo-input">
                        <label>Bairro</label>
                        <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
                    </div>
                    <div className="grupo-input">
                        <label>Descrição</label>
                        <textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                    </div>
                    <div className="cartao-gps">
                        <button type="button" className="btn-gps sucesso" onClick={capturarLocalizacao}>
                            {buscandoGps ? "Atualizando..." : <><MapPin size={20} /> Atualizar Coordenadas</>}
                        </button>
                    </div>
                    <button type="submit" className="btn-submit">
                        <Save size={20} /> Salvar Alterações
                    </button>
                </form>
            </div>
        </>
    )



}